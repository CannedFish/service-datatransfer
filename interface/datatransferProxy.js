// This file is auto generated based on user-defined interface.
// Please make sure that you have checked all TODOs in this file.
// TODO: please replace types with peramters' name you wanted of any functions
// TODO: please replace $ipcType with one of dbus, binder, websocket and socket

var initObj = {
  "address": "nodejs.webde.dataTransfer",
  "path": "/nodejs/webde/dataTransfer",
  "name": "nodejs.webde.dataTransfer",
  "type": "dbus",
  "service": false
}

function Proxy() {
  // TODO: please replace $IPC with the real path of webde-rpc module in your project
  this._ipc = require('webde-rpc').getIPC(initObj);
  this._token = 0;

  // TODO: choose to implement interfaces of ipc
  /* handle message send from service
  this._ipc.onMsg = function(msg) {
    // TODO: your handler
  }*/

  /* handle the event emitted when connected succeffuly
  this._ipc.onConnect = function() {
    // TODO: your handler
  }*/

  /* handle the event emitted when connection has been closed
  this._ipc.onClose = function() {
    // TODO: your handler
  }*/

  /* handle the event emitted when error occured
  this._ipc.onError = function(err) {
    // TODO: your handler
  }*/
}

/**
 * @description
 *    Copy file including from local to remote, from remote to local and from local to local
 * @param
 *    param1: src directory -> String
 *    param2: dst directory -> String
 *    e.g. IP:path, 192.168.1.100:/path/to/file or just /path/to/file
 *    param3: callback function -> Function
 *      @description
 *        a callback function called to get returns
 *      @param
 *        param1: return object -> Object
 * @return
 *    Error description or nothing
 */
Proxy.prototype.cpFile = function(String, String, callback) {
  var l = arguments.length,
      args = Array.prototype.slice.call(arguments, 0, (typeof callback === 'undefined' ? l : l - 1));
  this._ipc.invoke({
    token: this._token++,
    name: 'cpFile',
    in: args,
    callback: callback
  });
};

/**
 * @description
 *    cancel data transmission
 * @param
 *    param1: session's ID -> String
 *    param2: callback function -> Function
 *      @description
 *        a callback function called to get returns
 *      @param
 *        param1: return object -> Object
 * @return
 *    Error description or nothing
 */
Proxy.prototype.cancel = function(String, callback) {
  var l = arguments.length,
      args = Array.prototype.slice.call(arguments, 0, (typeof callback === 'undefined' ? l : l - 1));
  this._ipc.invoke({
    token: this._token++,
    name: 'cancel',
    in: args,
    callback: callback
  });
};

var net = require('net');
/**
 * @description
 *    Set up a data channel and binding with the channel represeted by sessionID
 * @param
 *    param1: {
 *      addr: peer's addr(default is undefined),
 *      sessionID: ID of an existed session(default is undefined)
 *    } -> Object 
 *    param2: callback function -> Function
 *      @description
 *        a callback function called to get returns
 *      @param
 *        param1: err description or null -> String or null
 *        param2: data channel
 * @return
 *    Error description or data channel
 */
Proxy.prototype.getChannel = function(target, callback) {
  var l = arguments.length,
      args = Array.prototype.slice.call(arguments, 0, (typeof callback === 'undefined' ? l : l - 1)),
      cb = function(ret) {
        if(ret.err) return callback(ret.err);
        var servPath = ret.ret,
            channel = net.connect({path: servPath}, function() {
              if(target.addr) {
                channel.write('0:' + target.addr);
              } else if (target.sessionID) {
                channel.id = target.sessionID;
                channel.write('2:' + target.sessionID);
              }
            }),
            dataHandle = function(chuck) {
              // console.log(chuck + '');
              var msg = (chuck + '').split(':');
              if(msg[0] == '0') {
                if(msg[1] == 'OK') {
                  channel.id = msg[2];
                  callback(null, channel);
                  channel.write('2:' + msg[2]);
                } else {
                  return callback('Error: ' + msg[2]);
                }
              } else if(msg[0] == '2') {
                if(msg[1] != 'OK') {
                  throw 'Fail to bind this process to DataTransfer.';
                }
                channel.removeListener('data', dataHandle);
                callback(null, channel);
              }
            };
        channel.on('data', dataHandle);
      };
  this._ipc.invoke({
    token: this._token++,
    name: 'getChannel',
    in: args,
    callback: cb
  });
}

/**
 * @description
 *    add listener for progress#srcPath, error#srcPath, end#srcPath
 * @param
 *    param1: event to listen -> String
 *    param2: a listener function -> Function
 *      @description
 *        a callback function called when events happened
 *      @param
 *        param1: description of this parameter -> type
 * @return
 *    itself of this instance
 */
Proxy.prototype.on = function(event, handler) {
  this._ipc.on(event, handler);
  return this;
};

/**
 * @description
 *    remove listener from progress#srcPath, error#srcPath, end#srcPath
 * @param
 *    param1: event to listen -> String
 *    param2: a listener function -> Function
 *      @description
 *        a callback function called when events happened
 *      @param
 *        param1: description of this parameter -> type
 * @return
 *    itself of this instance
 */
Proxy.prototype.off = function(event, handler) {
  this._ipc.removeListener(event, handler);
  return this;
};

var proxy = null;
exports.getProxy = function() {
  if(proxy == null) {
    proxy = new Proxy();
  }
  return proxy;
};
