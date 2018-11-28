import { Promise } from "es6-promise";
import { TALKER_CONTENT_TYPE } from "./constants";
import Talker from "./index";

abstract class Message {
  protected readonly type: string = TALKER_CONTENT_TYPE;

  constructor(
    /*
     * @property talker - A {@link Talker} instance that will be used to send responses
     */
    protected readonly talker: Talker,
    /*
     * @property namespace - A namespace to with which to categorize messages
     */
    public readonly namespace: string,
    public readonly data: Stringifyable,
    public readonly responseToId: number | null = null
  ) {}
}

export interface JSONableMessage {
  readonly namespace?: string;
  readonly data?: Stringifyable;
  readonly id?: number;
  readonly responseToId?: number;
  readonly type: string;
  readonly handshake?: boolean;
  readonly handshakeConfirmation?: boolean;
}

export interface Stringifyable {
  [index: string]:
    | string
    | number
    | Stringifyable
    | Stringifyable[]
    | boolean
    | null
    | undefined;
}

// Consuming applications will almost never interact with this class.
export class OutgoingMessage extends Message {
  public readonly id: number = this.talker.nextId();

  /**
   * @param talker
   * @param namespace
   * @param data
   * @param responseToId - If this is a response to a previous message, its ID.
   */
  constructor(
    protected readonly talker: Talker,
    public readonly namespace: string,
    public readonly data: Stringifyable,
    public readonly responseToId: number | null = null
  ) {
    super(talker, namespace, data, responseToId);
  }

  toJSON(): JSONableMessage {
    const { id, responseToId, namespace, data, type }: OutgoingMessage = this;
    return {
      id,
      responseToId: responseToId || undefined,
      namespace,
      data,
      type
    };
  }
}

// Consuming applications will interact with this class, but will almost never manually create an instance.
export class IncomingMessage extends Message {
  constructor(
    protected readonly talker: Talker,
    public readonly namespace: string = "",
    public readonly data: Stringifyable = {},
    // The ID of the message received from the remoteWindow
    public readonly id: number = 0
  ) {
    super(talker, namespace, data);
  }

  /**
   * Please note that this response message will use the same timeout as Talker#send.
   */
  respond(data: Stringifyable): Promise<IncomingMessage | Error> {
    return this.talker.send(this.namespace, data, this.id);
  }
}
