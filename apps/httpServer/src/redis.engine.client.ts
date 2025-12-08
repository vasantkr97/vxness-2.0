import { createRedisClient } from "@vxness/redis"

const CALLBACK_QUEUE = "callback-queue";
const REQUEST_STREAM_KEY = "trading-engine";
const RETRY_DELAY_MS = 5000
const POLLING_TIMEOUT = 0 



type EngineResponse = Record<string, string>;
type ResolveFunction = (data: EngineResponse) => void;


const publisherNonBlockingRedis = createRedisClient(); //publisher
const subscriberBlockingRedis = createRedisClient(); //Subscriber {blocking connection and listening}
const pendingRequests = new Map<string, ResolveFunction>();
const activeTimeouts = new Map<string, NodeJS.Timeout>();
let isListenerActive = false;

//convert the Redis Stream raw fields array into a structured data object.
const parseStreamData  = (rawFields: string[]): EngineResponse => {
    const data: EngineResponse = {}
    //iterate two steps at a time (key=i, value=i+1)
    for (let i=0; i< rawFields.length; i+=2) {
        //Ensure both key and value exist before assigning
        const key = rawFields[i];
        const value = rawFields[i+1];
        if (key !== undefined && value !== undefined) {
            data[key] = value
        }
    }
    return data
}

 // The Heartbeat: Continuously polls Redis for new engine responses.
 // It uses a "Recursive Polling" pattern rather than a simple 'while(true)' loop.
 //This ensures we handle async operations correctly without blocking the Node event loop.
const startListeningLoop = async (): Promise<void> => {
    if (isListenerActive) return;
    isListenerActive = true;

    //Start reading from the latest ID ($)
    let lastReadMessageId = "$"
  console.log(`[Redis:Listener] 🟢 Listening for engine responses on '${CALLBACK_QUEUE}'...`);
    
    const pollForNewMessage = async () => {
        try {
            //Xread Block 0 waits indefinetely for a message.
            const streams = await subscriberBlockingRedis.xread(
                "BLOCK", 
                POLLING_TIMEOUT,
                "STREAMS", 
                CALLBACK_QUEUE, 
                lastReadMessageId
            )

            //validate: Did we actally get data?
            if (!streams || streams.length === 0) {
                return setImmediate(pollForNewMessage)
            }

            const streamData = streams[0];
            if (!streamData) {
                return setImmediate(pollForNewMessage)
            }

            const messages = streamData[1]
            for (const [streamMsgId, rawBody] of messages) {
                //1. Update the cursor so we dont read this message again
                lastReadMessageId = streamMsgId as string;

                //2. Parse the data
                const responseData = parseStreamData(rawBody as string[]);
                const correlationId = responseData.id; //The Id we sent in the request

                //3. Find who is waiting for this specific ID (resolver that promise)
                if (correlationId && pendingRequests.has(correlationId)) {
                    console.log(`[Redis:Listener] ✅ Received reply for ${correlationId}`);          
                    
                    const resolveFunction = pendingRequests.get(correlationId)!;

                    //4.ClearUP memory
                    const timeoutTimer  = activeTimeouts.get(correlationId)
                    if (timeoutTimer) {
                        clearTimeout(timeoutTimer)
                    }
                    pendingRequests.delete(correlationId);
                    activeTimeouts.delete(correlationId)

                    //5.Acknowledege and clean uo the message from the stream for memory
                    subscriberBlockingRedis.xdel(CALLBACK_QUEUE, streamMsgId).catch(err => {
                        console.error(`[Redis:Listener] Failed to XDEL message ${streamMsgId}`, err)
                    })

                    //FulFill the Promise
                    resolveFunction(responseData)
                }
            }
            //Process next batch immediately
            setImmediate(pollForNewMessage)
        } catch (error) {
            console.error("[Redis:Listener] 🔴 Polling error. Retrying in 2s...", error);
            //Wait a bit before retrying to avoid spamming logs if Redis is down
            //await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
            setTimeout(pollForNewMessage, RETRY_DELAY_MS)
        }
    }
    
    //kick off the loop
    pollForNewMessage() 
}


//Sends a request to the trading Engine and returns a Promise that resolves
//only when the engine replies via the response stream using the correlation ID
// @param requestId A unique ID to correlate the request with its response.
// @param payload The data payload to send to the engine.
// @param timeoutMs The maximum time to wait for a response.
export const dispatchToEngine = async (
    requestId: string,
    payload: Record<string, any>,
    timeoutMs = 5000
): Promise<Record<string, string>> => {

    //lazy start: Ensure the listener is running if this is the first request
    if (!isListenerActive) {
        startListeningLoop()
    }

    return new Promise((resolve, reject) => {
        //1. Setup the "Safety net" (Timeout)
        const timeoutTimer = setTimeout(() => {
            //If time runs out, clean up map entries so they dont leak
            if (pendingRequests.has(requestId)) {
                pendingRequests.delete(requestId);
                activeTimeouts.delete(requestId);
                reject(new Error(`[Redis:Timeout] No response for ${requestId} within ${timeoutMs}ms`))
            }
        }, timeoutMs)

        //2.Register this request so the listener knows how to find us
        pendingRequests.set(requestId, resolve)
        activeTimeouts.set(requestId, timeoutTimer);

        //3.Fire and forget the messaget to Redis
        console.log(`[Redis:Publish] Sending request ${requestId}`)

        publisherNonBlockingRedis.xadd(
            REQUEST_STREAM_KEY,
            "*", //Let Redis auto-generated ID
            "id",
            requestId,
            "payload",
            JSON.stringify(payload)
        ).catch(() => {
            //If publishing fails, manually trigger the rejection
            clearTimeout(timeoutTimer);
            pendingRequests.delete(requestId);
            activeTimeouts.delete(requestId);
            reject(new Error(`[Redis:Publish] Failed to publish request ${requestId}`))
        })
    })

}