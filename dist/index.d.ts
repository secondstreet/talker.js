import { ManipulablePromise } from "./utils/manipulable-promise";
import { IncomingMessage, OutgoingMessage, Stringifyable } from "./message";
/**
 * Talker
 * Opens a communication line between this window and a remote window via postMessage.
 */
declare class Talker {
    private readonly remoteWindow;
    private readonly remoteOrigin;
    private readonly localWindow;
    timeout: number;
    /**
     * @property onMessage - Will be called with every non-handshake, non-response message from the remote window
     */
    onMessage?: (message: IncomingMessage) => void;
    private readonly handshake;
    private handshaken;
    private latestId;
    private readonly queue;
    private readonly sent;
    /**
     * @param remoteWindow - The remote `window` object to post/receive messages to/from
     * @param remoteOrigin - The protocol, host, and port you expect the remoteWindow to be
     * @param localWindow - The local `window` object
     */
    constructor(remoteWindow: Window, remoteOrigin: string, localWindow?: Window);
    /**
     * @param namespace - The namespace the message is in
     * @param data - The data to send
     * @param responseToId - If this is a response to a previous message, its ID.
     */
    send(namespace: string, data: Stringifyable, responseToId?: number | null): ManipulablePromise<IncomingMessage | Error>;
    /**
     * This is not marked private because other Talker-related classes need access to it,
     * but your application code should probably avoid calling this method.
     */
    nextId(): number;
    private receiveMessage;
    /**
     * Determines whether it is safe and appropriate to parse a postMessage messageEvent
     * @param source - "source" property from the postMessage event
     * @param origin - Protocol, host, and port
     * @param type - Internet Media Type
     */
    private isSafeMessage;
    private handleHandshake;
    private handleMessage;
    /**
     * @param id - Message ID of the waiting promise
     * @param message - Message that is responding to that ID
     */
    private respondToMessage;
    /**
     * Send a non-response message to awaiting hooks/callbacks
     * @param message - Message that arrived
     */
    private broadcastMessage;
    /**
     * Send a handshake message to the remote window
     * @param confirmation - Is this a confirmation handshake?
     */
    private sendHandshake;
    /**
     * Wrapper around window.postMessage to only send if we have the necessary objects
     */
    private postMessage;
    /**
     * Flushes the internal queue of outgoing messages, sending each one.
     * Does nothing if Talker has not handshaken with the remote.
     */
    private flushQueue;
}
export { IncomingMessage, OutgoingMessage };
export default Talker;
