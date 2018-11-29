var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { TALKER_CONTENT_TYPE } from "./constants";
var Message = /** @class */ (function () {
    function Message(
    /*
     * @property talker - A {@link Talker} instance that will be used to send responses
     */
    talker, 
    /*
     * @property namespace - A namespace to with which to categorize messages
     */
    namespace, data, responseToId) {
        if (responseToId === void 0) { responseToId = null; }
        this.talker = talker;
        this.namespace = namespace;
        this.data = data;
        this.responseToId = responseToId;
        this.type = TALKER_CONTENT_TYPE;
    }
    return Message;
}());
// Consuming applications will almost never interact with this class.
var OutgoingMessage = /** @class */ (function (_super) {
    __extends(OutgoingMessage, _super);
    /**
     * @param talker
     * @param namespace
     * @param data
     * @param responseToId - If this is a response to a previous message, its ID.
     */
    function OutgoingMessage(talker, namespace, data, responseToId) {
        if (responseToId === void 0) { responseToId = null; }
        var _this = _super.call(this, talker, namespace, data, responseToId) || this;
        _this.talker = talker;
        _this.namespace = namespace;
        _this.data = data;
        _this.responseToId = responseToId;
        _this.id = _this.talker.nextId();
        return _this;
    }
    OutgoingMessage.prototype.toJSON = function () {
        var _a = this, id = _a.id, responseToId = _a.responseToId, namespace = _a.namespace, data = _a.data, type = _a.type;
        return {
            id: id,
            responseToId: responseToId || undefined,
            namespace: namespace,
            data: data,
            type: type
        };
    };
    return OutgoingMessage;
}(Message));
export { OutgoingMessage };
// Consuming applications will interact with this class, but will almost never manually create an instance.
var IncomingMessage = /** @class */ (function (_super) {
    __extends(IncomingMessage, _super);
    function IncomingMessage(talker, namespace, data, 
    // The ID of the message received from the remoteWindow
    id) {
        if (namespace === void 0) { namespace = ""; }
        if (data === void 0) { data = {}; }
        if (id === void 0) { id = 0; }
        var _this = _super.call(this, talker, namespace, data) || this;
        _this.talker = talker;
        _this.namespace = namespace;
        _this.data = data;
        _this.id = id;
        return _this;
    }
    /**
     * Please note that this response message will use the same timeout as Talker#send.
     */
    IncomingMessage.prototype.respond = function (data) {
        return this.talker.send(this.namespace, data, this.id);
    };
    return IncomingMessage;
}(Message));
export { IncomingMessage };
//# sourceMappingURL=message.js.map