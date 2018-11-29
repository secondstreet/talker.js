import createManipulablePromise from "./utils/manipulable-promise";
import { IncomingMessage, OutgoingMessage } from "./message";
import { TALKER_CONTENT_TYPE, TALKER_ERR_MSG_TIMEOUT } from "./constants";
/**
 * Talker
 * Opens a communication line between this window and a remote window via postMessage.
 */
var Talker = /** @class */ (function () {
    /**
     * @param remoteWindow - The remote `window` object to post/receive messages to/from
     * @param remoteOrigin - The protocol, host, and port you expect the remoteWindow to be
     * @param localWindow - The local `window` object
     */
    function Talker(remoteWindow, remoteOrigin, localWindow) {
        if (localWindow === void 0) { localWindow = window; }
        var _this = this;
        this.remoteWindow = remoteWindow;
        this.remoteOrigin = remoteOrigin;
        this.localWindow = localWindow;
        /*
         * @property timeout - The number of milliseconds to wait before assuming no response will be received.
         */
        this.timeout = 3000;
        // Will be resolved when a handshake is newly established with the remote window.
        this.handshake = createManipulablePromise();
        // Whether we've received a handshake from the remote window
        this.handshaken = false;
        // The ID of the latest OutgoingMessage
        this.latestId = 0;
        this.queue = [];
        this.sent = {};
        this.localWindow.addEventListener("message", function (messageEvent) { return _this.receiveMessage(messageEvent); }, false);
        this.sendHandshake();
        return this;
    }
    /**
     * @param namespace - The namespace the message is in
     * @param data - The data to send
     * @param responseToId - If this is a response to a previous message, its ID.
     */
    Talker.prototype.send = function (namespace, data, responseToId) {
        if (responseToId === void 0) { responseToId = null; }
        var message = new OutgoingMessage(this, namespace, data, responseToId);
        var promise = createManipulablePromise();
        this.sent[message.id] = promise;
        this.queue.push(message);
        this.flushQueue();
        setTimeout(function () {
            if (!promise.__reject__) {
                return;
            }
            promise.__reject__(new Error(TALKER_ERR_MSG_TIMEOUT));
        }, this.timeout);
        return promise;
    };
    /**
     * This is not marked private because other Talker-related classes need access to it,
     * but your application code should probably avoid calling this method.
     */
    Talker.prototype.nextId = function () {
        return (this.latestId += 1);
    };
    Talker.prototype.receiveMessage = function (messageEvent) {
        var object;
        try {
            object = JSON.parse(messageEvent.data);
        }
        catch (err) {
            object = {
                namespace: "",
                data: {},
                id: this.nextId(),
                type: TALKER_CONTENT_TYPE
            };
        }
        if (!this.isSafeMessage(messageEvent.source, messageEvent.origin, object.type)) {
            return;
        }
        var isHandshake = object.handshake || object.handshakeConfirmation;
        return isHandshake
            ? this.handleHandshake(object)
            : this.handleMessage(object);
    };
    /**
     * Determines whether it is safe and appropriate to parse a postMessage messageEvent
     * @param source - "source" property from the postMessage event
     * @param origin - Protocol, host, and port
     * @param type - Internet Media Type
     */
    Talker.prototype.isSafeMessage = function (source, origin, type) {
        var isSourceSafe = source === this.remoteWindow;
        var isOriginSafe = this.remoteOrigin === "*" || origin === this.remoteOrigin;
        var isTypeSafe = type === TALKER_CONTENT_TYPE;
        return isSourceSafe && isOriginSafe && isTypeSafe;
    };
    Talker.prototype.handleHandshake = function (object) {
        if (object.handshake) {
            // One last handshake in case the remote window (which we now know is ready) hasn't seen ours yet
            this.sendHandshake(this.handshaken);
        }
        if (!this.handshaken) {
            this.handshaken = true;
            if (this.handshake.__resolve__) {
                this.handshake.__resolve__(this.handshaken);
            }
            this.flushQueue();
        }
    };
    Talker.prototype.handleMessage = function (rawObject) {
        var message = new IncomingMessage(this, rawObject.namespace, rawObject.data, rawObject.id);
        var responseId = rawObject.responseToId;
        return responseId
            ? this.respondToMessage(responseId, message)
            : this.broadcastMessage(message);
    };
    /**
     * @param id - Message ID of the waiting promise
     * @param message - Message that is responding to that ID
     */
    Talker.prototype.respondToMessage = function (id, message) {
        var sent = this.sent[id];
        if (sent && sent.__resolve__) {
            sent.__resolve__(message);
            delete this.sent[id];
        }
    };
    /**
     * Send a non-response message to awaiting hooks/callbacks
     * @param message - Message that arrived
     */
    Talker.prototype.broadcastMessage = function (message) {
        if (this.onMessage) {
            this.onMessage.call(this, message);
        }
    };
    /**
     * Send a handshake message to the remote window
     * @param confirmation - Is this a confirmation handshake?
     */
    Talker.prototype.sendHandshake = function (confirmation) {
        if (confirmation === void 0) { confirmation = false; }
        var _a;
        return this.postMessage((_a = {
                type: TALKER_CONTENT_TYPE
            },
            _a[confirmation ? "handshakeConfirmation" : "handshake"] = true,
            _a));
    };
    /**
     * Wrapper around window.postMessage to only send if we have the necessary objects
     */
    Talker.prototype.postMessage = function (data) {
        var message = JSON.stringify(data);
        if (this.remoteWindow && this.remoteOrigin) {
            try {
                this.remoteWindow.postMessage(message, this.remoteOrigin);
            }
            catch (e) {
                // no-op
            }
        }
    };
    /**
     * Flushes the internal queue of outgoing messages, sending each one.
     * Does nothing if Talker has not handshaken with the remote.
     */
    Talker.prototype.flushQueue = function () {
        if (this.handshaken) {
            while (this.queue.length > 0) {
                var message = this.queue.shift();
                if (message) {
                    this.postMessage(message);
                }
            }
        }
    };
    return Talker;
}());
export { IncomingMessage, OutgoingMessage };
export default Talker;
//# sourceMappingURL=index.js.map