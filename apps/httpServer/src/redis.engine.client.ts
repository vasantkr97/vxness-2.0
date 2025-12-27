import createRedisClient from "@vxness/redis";
import { REDIS_ENGINE_CONSTANTS } from "@vxness/types";



type EngineResponse = Record<string, string>;
type ResolveFunction = (data: EngineResponse) => void;


const publisherNonBlockingRedis = createRedisClient(); //publisher
const subscriberBlockingRedis = createRedisClient(); //Subscriber {blocking connection and listening}
const pendingRequests = new Map<string, ResolveFunction>();
const activeTimeouts = new Map<string, NodeJS.Timeout>();
let isListenerActive = false;

const parseStreamData = (rawFields: string[]): EngineResponse => {
    const data: EngineResponse = {}
    for (let i = 0; i < rawFields.length; i += 2) {
        const key = rawFields[i];
        const value = rawFields[i + 1];
        if (key !== undefined && value !== undefined) {
            data[key] = value
        }
    }
    return data
}

//Continuously polls Redis for new engine responses, "Recursive Polling" pattern 
const startListeningLoop = async (): Promise<void> => {
    if (isListenerActive) return;
    isListenerActive = true;

    let lastReadMessageId = "$"
    console.log(`[Redis:Listener] 🟢 Listening for engine responses on '${REDIS_ENGINE_CONSTANTS.CALLBACK_QUEUE}'...`);

    const pollForNewMessage = async () => {
        try {
            const streams = await subscriberBlockingRedis.xread(
                "BLOCK",
                REDIS_ENGINE_CONSTANTS.POLLING_TIMEOUT,
                "STREAMS",
                REDIS_ENGINE_CONSTANTS.CALLBACK_QUEUE,
                lastReadMessageId
            )

            if (!streams || streams.length === 0) {
                return setImmediate(pollForNewMessage)
            }

            const streamData = streams[0];
            if (!streamData) {
                return setImmediate(pollForNewMessage)
            }

            const messages = streamData[1]
            for (const [streamMsgId, rawBody] of messages) {

                lastReadMessageId = streamMsgId as string;

                const responseData = parseStreamData(rawBody as string[]);
                const correlationId = responseData.id; 

                if (correlationId && pendingRequests.has(correlationId)) {
                    console.log(`[Redis:Listener] ✅ Received reply for ${correlationId}`);

                    const resolveFunction = pendingRequests.get(correlationId)!;

                 
                    const timeoutTimer = activeTimeouts.get(correlationId)
                    if (timeoutTimer) {
                        clearTimeout(timeoutTimer)
                    }
                    pendingRequests.delete(correlationId);
                    activeTimeouts.delete(correlationId)

                    //Acknowledege and clean uo the message from the stream for memory
                    subscriberBlockingRedis.xdel(REDIS_ENGINE_CONSTANTS.CALLBACK_QUEUE, streamMsgId).catch(err => {
                        console.error(`[Redis:Listener] Failed to XDEL message ${streamMsgId}`, err)
                    })

                    resolveFunction(responseData)
                }
            }

            setImmediate(pollForNewMessage)
        } catch (error) {
            //await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
            setTimeout(pollForNewMessage, REDIS_ENGINE_CONSTANTS.RETRY_DELAY_MS)
        }
    }

    pollForNewMessage()
}

export const dispatchToEngine = async (
    requestId: string,
    payload: Record<string, any>,
    timeoutMs = 5000
): Promise<Record<string, string>> => {

    //lazy start ensure the listener is running if this is the first request
    if (!isListenerActive) {
        startListeningLoop()
    }

    return new Promise((resolve, reject) => {
        const timeoutTimer = setTimeout(() => {
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                activeTimeouts.delete(requestId);
                reject(new Error(`[Redis:Timeout] No response for ${requestId} within ${timeoutMs}ms`))
            }
        }, timeoutMs)

        pendingRequests.set(requestId, resolve)
        activeTimeouts.set(requestId, timeoutTimer);


        publisherNonBlockingRedis.xadd(
            REDIS_ENGINE_CONSTANTS.REQUEST_STREAM_KEY,
            "*", 
            "id",
            requestId,
            "payload",
            JSON.stringify(payload)
        ).catch(() => {
            clearTimeout(timeoutTimer);
            pendingRequests.delete(requestId);
            activeTimeouts.delete(requestId);
            reject(new Error(`[Redis:Publish] Failed to publish request ${requestId}`))
        })
    })

}