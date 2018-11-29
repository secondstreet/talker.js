/*!
 * @overview talker.js - a tiny promise-based wrapper for HTML5 postMessage
 * @copyright Copyright (c) 2018 Second Street and contributors
 * @license Licensed under MIT License https://github.com/secondstreet/talker.js/blob/master/LICENSE
 */

import createManipulablePromise, {
  ManipulablePromise
} from "./utils/manipulable-promise";
import {
  IncomingMessage,
  OutgoingMessage,
  JSONableMessage,
  Stringifyable
} from "./message";
import { TALKER_CONTENT_TYPE, TALKER_ERR_MSG_TIMEOUT } from "./constants";

interface SentMessages {
  [id: number]: ManipulablePromise<IncomingMessage | Error>;
}

/**
 * Talker
 * Opens a communication line between this window and a remote window via postMessage.
 */
class Talker {
  /*
   * @property timeout - The number of milliseconds to wait before assuming no response will be received.
   */
  public timeout: number = 3000;

  /**
   * @property onMessage - Will be called with every non-handshake, non-response message from the remote window
   */
  onMessage?: (message: IncomingMessage) => void;

  // Will be resolved when a handshake is newly established with the remote window.
  private readonly handshake: ManipulablePromise<
    boolean
  > = createManipulablePromise();
  // Whether we've received a handshake from the remote window
  private handshaken: boolean = false;
  // The ID of the latest OutgoingMessage
  private latestId: number = 0;
  private readonly queue: OutgoingMessage[] = [];
  private readonly sent: SentMessages = {};

  /**
   * @param remoteWindow - The remote `window` object to post/receive messages to/from
   * @param remoteOrigin - The protocol, host, and port you expect the remoteWindow to be
   * @param localWindow - The local `window` object
   */
  constructor(
    private readonly remoteWindow: Window,
    private readonly remoteOrigin: string,
    private readonly localWindow: Window = window
  ) {
    this.localWindow.addEventListener(
      "message",
      (messageEvent: MessageEvent) => this.receiveMessage(messageEvent),
      false
    );
    this.sendHandshake();

    return this;
  }

  /**
   * @param namespace - The namespace the message is in
   * @param data - The data to send
   * @param responseToId - If this is a response to a previous message, its ID.
   */
  send(
    namespace: string,
    data: Stringifyable,
    responseToId: number | null = null
  ): ManipulablePromise<IncomingMessage | Error> {
    const message = new OutgoingMessage(this, namespace, data, responseToId);

    const promise = createManipulablePromise<IncomingMessage | Error>();

    this.sent[message.id] = promise;
    this.queue.push(message);
    this.flushQueue();

    setTimeout(() => {
      if (!promise.__reject__) {
        return;
      }
      promise.__reject__(new Error(TALKER_ERR_MSG_TIMEOUT));
    }, this.timeout);

    return promise;
  }

  /**
   * This is not marked private because other Talker-related classes need access to it,
   * but your application code should probably avoid calling this method.
   */
  nextId(): number {
    return (this.latestId += 1);
  }

  private receiveMessage(messageEvent: MessageEvent): void {
    let object: JSONableMessage;
    try {
      object = JSON.parse(messageEvent.data);
    } catch (err) {
      object = {
        namespace: "",
        data: {},
        id: this.nextId(),
        type: TALKER_CONTENT_TYPE
      };
    }
    if (
      !this.isSafeMessage(messageEvent.source, messageEvent.origin, object.type)
    ) {
      return;
    }

    const isHandshake = object.handshake || object.handshakeConfirmation;
    return isHandshake
      ? this.handleHandshake(object)
      : this.handleMessage(object);
  }

  /**
   * Determines whether it is safe and appropriate to parse a postMessage messageEvent
   * @param source - "source" property from the postMessage event
   * @param origin - Protocol, host, and port
   * @param type - Internet Media Type
   */
  private isSafeMessage(
    source: Window | MessagePort | ServiceWorker | null,
    origin: string,
    type: string
  ): boolean {
    const isSourceSafe = source === this.remoteWindow;
    const isOriginSafe =
      this.remoteOrigin === "*" || origin === this.remoteOrigin;
    const isTypeSafe = type === TALKER_CONTENT_TYPE;
    return isSourceSafe && isOriginSafe && isTypeSafe;
  }

  private handleHandshake(object: JSONableMessage): void {
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
  }

  private handleMessage(rawObject: JSONableMessage): void {
    const message = new IncomingMessage(
      this,
      rawObject.namespace,
      rawObject.data,
      rawObject.id
    );
    const responseId = rawObject.responseToId;
    return responseId
      ? this.respondToMessage(responseId, message)
      : this.broadcastMessage(message);
  }

  /**
   * @param id - Message ID of the waiting promise
   * @param message - Message that is responding to that ID
   */
  private respondToMessage(id: number, message: IncomingMessage): void {
    const sent = this.sent[id];
    if (sent && sent.__resolve__) {
      sent.__resolve__(message);
      delete this.sent[id];
    }
  }

  /**
   * Send a non-response message to awaiting hooks/callbacks
   * @param message - Message that arrived
   */
  private broadcastMessage(message: IncomingMessage): void {
    if (this.onMessage) {
      this.onMessage.call(this, message);
    }
  }

  /**
   * Send a handshake message to the remote window
   * @param confirmation - Is this a confirmation handshake?
   */
  private sendHandshake(confirmation: boolean = false): void {
    return this.postMessage({
      type: TALKER_CONTENT_TYPE,
      [confirmation ? "handshakeConfirmation" : "handshake"]: true
    });
  }

  /**
   * Wrapper around window.postMessage to only send if we have the necessary objects
   */
  private postMessage(data: OutgoingMessage | JSONableMessage): void {
    const message = JSON.stringify(data);
    if (this.remoteWindow && this.remoteOrigin) {
      try {
        this.remoteWindow.postMessage(message, this.remoteOrigin);
      } catch (e) {
        // no-op
      }
    }
  }

  /**
   * Flushes the internal queue of outgoing messages, sending each one.
   * Does nothing if Talker has not handshaken with the remote.
   */
  private flushQueue(): void {
    if (this.handshaken) {
      while (this.queue.length > 0) {
        const message = this.queue.shift();
        if (message) {
          this.postMessage(message);
        }
      }
    }
  }
}

export { IncomingMessage, OutgoingMessage };
export default Talker;
