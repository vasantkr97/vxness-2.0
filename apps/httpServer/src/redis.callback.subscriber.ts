import { createRedisClient } from "@vxness/redis"

export const RESPONSE_STREAM_KEY = "callback_queue";
const DEFAULT_TIMEOUT_MS = 5000



type ResponseData = Record<string, string>;
type ResolveFunction = (data: ResponseData) => void;
type PromiseResolvers = Record<string, ResolveFunction>;
type TimeoutTrackers = Record<string, NodeJS.Timeout>;

//convert the Redis Stream raw fields array into a structured data object.
const parseStreamEntry  = (rawFields: string[]): ResponseData => {
    const data: ResponseData = {}
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

//Processes a single incoming message, resolving the corresponding Promise.
const handleIncomingResponse = (
    promiseResolvers: PromiseResolvers,
    timeouttrackers: TimeoutTrackers,
    rawFields: string[]
) => {
    const responseData = parseStreamEntry(rawFields)
    const responseId = responseData.id;

    console.log("[SUBSCRIBER] received response:", responseData)

    if (!responseId) {
        console.log("[SUBSCRIBER] Message missing response ID");
        return
    }

    const resolveFn = promiseResolvers[responseId];

    if (resolveFn) {
        resolveFn(responseData);

        //clean up resolver and timeout
        delete promiseResolvers[responseId];

        const timer = timeouttrackers[responseId];
        if (timer) {
            clearTimeout(timer);
            delete timeouttrackers[responseId]
        }
    } else {
        console.log(`[SUBSCRIBER] no waiter for ID: ${responseId}`)
    }
}

//The main loop to continuosly read from Redis Stream using Xread Block
const startListeningLoop = async (
    redisClient: ReturnType<typeof createRedisClient>,
    promiseResolvers: PromiseResolvers,
    timeouttrackers: TimeoutTrackers
): Promise<never> => {
    //Start reading from the latest ID ($)
    let lastId = "$"
    while (true) {
        try {
            //XREAD block 0 steams key $ will block until a message is new message arrives
            const response = await redisClient.xread(
                "BLOCK",
                0,
                "STREAMS",
                RESPONSE_STREAM_KEY,
                lastId
            );

            // Check if response is valid (structure: [[key, [[id, [field, value, ...]], ...]]])
            if (!response?.length || !response[0] || !response[0][1]?.length){
                continue
            }

            const [, messages] = response[0]

            for (const [messageId, rawFields] of messages) {
                // messageId is the stream ID, but the code uses a field 'id' within the message
                // to match the promise, so we dont strictly need messageId here
                handleIncomingResponse(promiseResolvers, timeouttrackers, rawFields as string[]);

                //Update lastID to the ID of the last message processed
                lastId = messageId as string;
            }
        } catch (error) {
            console.error("[SUBSCRIBER] xread error:", error)
            // Wait before trying again to avoid rapid failure loop
            await new Promise((resolve => setTimeout(resolve, DEFAULT_TIMEOUT_MS)))
        }
    }
}

//Factory function to create and manage the response waiting instance
export const createResponseAwaiter = () => {
    const redisClient = createRedisClient()
    // Local state for this specific awaiter instance
    const promiseResolvers: PromiseResolvers = {}
    const timeouttrackers: TimeoutTrackers = {}

    //start the perpetual listening loop
    startListeningLoop(redisClient, promiseResolvers, timeouttrackers);

    return {
        //Returns a promise that resolves when a message with the specified ID is arrived
        //or rejects in timeout
        awaitResponse: (responseId: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<ResponseData> => {
            console.log(`[SUBSCRIBER] waiting for response with ID: ${responseId}`);

            //Ensure no existing waiter for this ID (prevents accidental overwrites/leaks)
            if (promiseResolvers[responseId]) {
                return Promise.reject(new Error(`Response ID: ${responseId} is already being awaited.`));
            }

            return new Promise((resolve, reject) => {
                //1. store the Promise resolver function
                promiseResolvers[responseId] = resolve;

                //2. Set up the timeout
                const timer = setTimeout(() => {
                    if (promiseResolvers[responseId]) {
                        delete promiseResolvers[responseId];
                        delete timeouttrackers[responseId];
                        reject(new Error(`Timeout waiting for response ID: ${responseId} after ${timeoutMs}ms`));
                    }
                }, timeoutMs);

                //3. Store the timer to allow cleanup on success
                timeouttrackers[responseId] = timer;
            })
        }
    }
}