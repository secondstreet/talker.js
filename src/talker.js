/*!
 * Talker.js 1.0.0 <https://github.com/secondstreet/talker.js>
 * Copyright 2014 Second Street
 * MIT License <http://opensource.org/licenses/MIT>
 */
//region Constants
var TALKER_TYPE = 'application/x-talkerjs-v1+json';
var TALKER_ERR_TIMEOUT = 'timeout';
//endregion Constants

//region Third-Party Libraries
/**
 * PinkySwear.js 2.1 <https://github.com/timjansen/PinkySwear.js>
 * License: Public Domain <http://creativecommons.org/publicdomain/zero/1.0/
 */
var _module = module, module = {}; // Shadow module so we can extract pinkySwear without it attaching to window
(function(c){function f(g){return"function"==typeof g}function h(g){"undefined"!=typeof setImmediate?setImmediate(g):"undefined"!=typeof process&&process.nextTick?process.nextTick(g):setTimeout(g,0)}c[0][c[1]]=function m(){function c(l,f){null==a&&null!=l&&(a=l,k=f,b.length&&h(function(){for(var a=0;a<b.length;a++)b[a]()}));return a}var a,k=[],b=[];c.then=function(c,n){function e(){try{var b=a?c:n;if(f(b)){var h=function(a){var c,b=0;try{if(a&&("object"==typeof a||f(a))&&f(c=a.then)){if(a===d)throw new TypeError;
    c.call(a,function(){b++||h.apply(void 0,arguments)},function(a){b++||d(!1,[a])})}else d(!0,arguments)}catch(e){b++||d(!1,[e])}};h(b.apply(void 0,k||[]))}else d(a,k)}catch(e){d(!1,[e])}}var d=m();null!=a?h(e):b.push(e);return d};return c}})("undefined"==typeof module?[window,"pinkySwear"]:[module,"exports"]);
var pinkySwear = module.exports;
module = _module;
/**
 * Object Create
 */
var objectCreate = function(proto) {
    function ctor () { }
    ctor.prototype = proto;
    return new ctor();
};
//endregion

//region Public Methods
/**
 * Talker
 * Used to open a communication line between this window and a remote window via postMessage.
 * @param remoteWindow - The remote `window` object to post/receive messages to/from.
 * @property {Window} remoteWindow - The remote window object this Talker is communicating with
 * @property {string} remoteOrigin - The protocol, host, and port you expect the remote to be
 * @property {number} timeout - The number of milliseconds to wait before assuming no response will be received.
 * @property {boolean} handshaken - Whether we've received a handshake from the remote window
 * @property {function(Talker.Message)} onMessage - Will be called with every non-handshake, non-response message from the remote window
 * @property {Promise} handshake - Will be resolved when a handshake is newly established with the remote window.
 * @returns {Talker}
 * @constructor
 */
Talker = function(remoteWindow, remoteOrigin) {
    this.remoteWindow = remoteWindow;
    this.remoteOrigin = remoteOrigin;
    this.timeout = 3000;

    this.handshaken = false;
    this.handshake = pinkySwear();
    this._id = 0;
    this._queue = [];
    this._sent = {};

    var _this = this;
    window.addEventListener('message', function(messageEvent) { _this._receiveMessage(messageEvent) }, false);
    this._sendHandshake();

    return this;
};

/**
 * Send
 * Sends a message and returns a promise
 * @param namespace - The namespace the message is in
 * @param data - The data to send, must be a JSON.stringify-able object
 * @param [responseToId=null] - If this is a response to a previous message, its ID.
 * @public
 * @returns {Promise} - May resolve with a {@link Talker.IncomingMessage}, or rejects with an Error
 */
Talker.prototype.send = function(namespace, data, responseToId) {
    var message = new Talker.OutgoingMessage(this, namespace, data, responseToId);

    var promise = pinkySwear();
    this._sent[message.id] = promise;

    this._queue.push(message);
    this._flushQueue();

    setTimeout(function() {
        promise(false, [new Error(TALKER_ERR_TIMEOUT)]); // Reject the promise
    }, this.timeout);

    return promise;
};
//endregion Public Methods

//region Private Methods
/**
 * Handles receipt of a message via postMessage
 * @param {MessageEvent} messageEvent
 * @private
 */
Talker.prototype._receiveMessage = function(messageEvent) {
    var object, isHandshake;

    try {
        object = JSON.parse(messageEvent.data);
    }
    catch (e) {
        object = {};
    }
    if (!this._isSafeMessage(messageEvent.source, messageEvent.origin, object.type)) { return false; }

    isHandshake = object.handshake || object.handshakeConfirmation;
    return isHandshake ? this._handleHandshake(object) : this._handleMessage(object);
};

/**
 * Determines whether it is safe and appropriate to parse a postMessage messageEvent
 * @param {Window} source - Source window object
 * @param {string} origin - Protocol, host, and port
 * @param {string} type - Internet Media Type
 * @returns {boolean}
 * @private
 */
Talker.prototype._isSafeMessage = function(source, origin, type) {
    var safeSource, safeOrigin, safeType;

    safeSource = source === this.remoteWindow;
    safeOrigin = (this.remoteOrigin === '*') || (origin === this.remoteOrigin);
    safeType = type === TALKER_TYPE;

    return safeSource && safeOrigin && safeType;
};

/**
 * Handle a handshake message
 * @param {Object} rawObject - The postMessage content, parsed into an Object
 * @private
 */
Talker.prototype._handleHandshake = function(object) {
    if (object.handshake) { this._sendHandshake(this.handshaken); } // One last handshake in case the remote window (which we now know is ready) hasn't seen ours yet
    this.handshaken = true;
    this.handshake(true, [this.handshaken]);
    this._flushQueue();
};

/**
 * Handle a non-handshake message
 * @param {Object} rawObject - The postMessage content, parsed into an Object
 * @private
 */
Talker.prototype._handleMessage = function(rawObject) {
    var message = new Talker.IncomingMessage(this, rawObject.namespace, rawObject.data, rawObject.id);
    var responseId = rawObject.responseToId;
    return responseId ? this._respondToMessage(responseId, message) : this._broadcastMessage(message);
};

/**
 * Send a response message back to an awaiting promise
 * @param {number} id - Message ID of the waiting promise
 * @param {Talker.Message} message - Message that is responding to that ID
 * @private
 */
Talker.prototype._respondToMessage = function(id, message) {
    if (this._sent[id]) {
        this._sent[id](true, [message]); // Resolve the promise
        delete this._sent[id];
    }
};

/**
 * Send a non-response message to awaiting hooks/callbacks
 * @param {Talker.Message} message - Message that arrived
 * @private
 */
Talker.prototype._broadcastMessage = function(message) {
    if (this.onMessage) { this.onMessage.call(this, message); }
};

/**
 * Send a handshake message to the remote window
 * @param {boolean} [confirmation] - Is this a confirmation handshake?
 * @private
 */
Talker.prototype._sendHandshake = function(confirmation) {
    var message = { type: TALKER_TYPE };
    var handshakeType = confirmation ? 'handshakeConfirmation' : 'handshake';
    message[handshakeType] = true;
    this._postMessage(message);
};

/**
 * Increment the internal ID and return a new one.
 * @returns {number}
 * @private
 */
Talker.prototype._nextId = function() {
    return this._id += 1;
};

/**
 * Wrapper around window.postMessage to only send if we have the necessary objects
 * @param {Object} data - A JSON.stringify'able object
 * @private
 */
Talker.prototype._postMessage = function(data) {
    if (this.remoteWindow && this.remoteOrigin) {
        this.remoteWindow.postMessage(JSON.stringify(data), this.remoteOrigin);
    }
};

/**
 * Flushes the internal queue of outgoing messages, sending each one.
 * @returns {Array} - Returns the queue for recursion
 * @private
 */
Talker.prototype._flushQueue = function() {
    if (this.handshaken) {
        var message = this._queue.shift();
        if (!message) { return this._queue; }
        this._postMessage(message);
        if (this._queue.length > 0) { return this._flushQueue(); }
    }
    return this._queue;
};
//endregion Private Methods

//region Talker Message
/**
 * Talker Message
 * Used to wrap a message for Talker with some extra metadata and methods
 * @param {Talker} talker - A {@link Talker} instance that will be used to send responses
 * @param {string} namespace - A namespace to with which to categorize messages
 * @param {Object} data - A JSON.stringify-able object
 * @property {number} id
 * @property {number} responseToId
 * @property {string} namespace
 * @property {Object} data
 * @property {string} type
 * @property {Talker} talker
 * @returns {Talker.Message}
 * @constructor
 */
Talker.Message = function(talker, namespace, data) {
    this.talker = talker;
    this.namespace = namespace;
    this.data = data;
    this.type = TALKER_TYPE;

    return this;
};
//endregion Talker Message

//region Talker Outgoing Message
/**
 * Talker Outgoing Message
 * @extends Talker.Message
 * @param {Talker} talker - A {@link Talker} instance that will be used to send responses
 * @param {string} namespace - A namespace to with which to categorize messages
 * @param {Object} data - A JSON.stringify-able object
 * @param [responseToId=null] - If this is a response to a previous message, its ID.
 * @constructor
 */
Talker.OutgoingMessage = function(talker, namespace, data, responseToId) {
    Talker.Message.call(this, talker, namespace, data);
    this.responseToId = responseToId || null;
    this.id = this.talker._nextId();
};
Talker.OutgoingMessage.prototype = objectCreate(Talker.Message.prototype);
Talker.OutgoingMessage.prototype.constructor = Talker.Message;

/**
 * @returns {Object}
 * @public
 */
Talker.OutgoingMessage.prototype.toJSON = function() {
    return {
        id: this.id,
        responseToId: this.responseToId,
        namespace: this.namespace,
        data: this.data,
        type: this.type
    };
};
//endregion Talker Outgoing Message

//region Talker Incoming Message
/**
 * Talker Incoming Message
 * @extends Talker.Message
 * @param {Talker} talker - A {@link Talker} instance that will be used to send responses
 * @param {string} namespace - A namespace to with which to categorize messages
 * @param {Object} data - A JSON.stringify-able object
 * @param {number} id - The ID received from the other side
 * @constructor
 */
Talker.IncomingMessage = function(talker, namespace, data, id) {
    Talker.Message.call(this, talker, namespace, data);
    this.id = id;
};
Talker.IncomingMessage.prototype = objectCreate(Talker.Message.prototype);
Talker.IncomingMessage.prototype.constructor = Talker.Message;

/**
 * Respond
 * Responds to a message
 * @param {Object} data - A JSON.stringify-able object
 * @public
 * @returns {Promise} - Resolves with a {@link Talker.IncomingMessage}, or rejects with an Error
 */
Talker.IncomingMessage.prototype.respond = function(data) {
    return this.talker.send(null, data, this.id);
};
//endregion Talker Incoming Message
