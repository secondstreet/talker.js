import { Promise } from "es6-promise";
import Talker from "./index";
declare abstract class Message {
    protected readonly talker: Talker;
    readonly namespace: string;
    readonly data: Stringifyable;
    readonly responseToId: number | null;
    protected readonly type: string;
    constructor(talker: Talker, namespace: string, data: Stringifyable, responseToId?: number | null);
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
    [index: string]: string | number | Stringifyable | Stringifyable[] | boolean | null | undefined;
}
export declare class OutgoingMessage extends Message {
    protected readonly talker: Talker;
    readonly namespace: string;
    readonly data: Stringifyable;
    readonly responseToId: number | null;
    readonly id: number;
    /**
     * @param talker
     * @param namespace
     * @param data
     * @param responseToId - If this is a response to a previous message, its ID.
     */
    constructor(talker: Talker, namespace: string, data: Stringifyable, responseToId?: number | null);
    toJSON(): JSONableMessage;
}
export declare class IncomingMessage extends Message {
    protected readonly talker: Talker;
    readonly namespace: string;
    readonly data: Stringifyable;
    readonly id: number;
    constructor(talker: Talker, namespace?: string, data?: Stringifyable, id?: number);
    /**
     * Please note that this response message will use the same timeout as Talker#send.
     */
    respond(data: Stringifyable): Promise<IncomingMessage | Error>;
}
export {};
