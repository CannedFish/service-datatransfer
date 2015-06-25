// This file is auto generated based on user-defined interface.
// Please make sure that you have checked all TODOs in this file.
// TODO: please replace types with peramters' name you wanted of any functions
// TODO: please replace $ipcType with one of dbus, binder, websocket and socket

var initObj = {
  "address": "nodejs.webde.dataTransfer",
  "path": "/nodejs/webde/dataTransfer",
  "name": "nodejs.webde.dataTransfer",
  "type": "dbus",
  "service": true,
  "interface": [
    {
      "name": "cpFile",
      "in": [
        "String",
        "String"
      ]
    }
  ],
  "serviceObj": {
    cpFile: function(srcPath, dstPath, callback) {
      dataTrans.cpFile(srcPath, dstPath, function(err, key) {
        if(err) return callback({err: err});
        callback({ret: key});
      });
    }
  }
}

function Stub() {
  // TODO: please replace $IPC with the real path of webde-rpc module in your project
  this._ipc = require('webde-rpc').getIPC(initObj);
}

Stub.prototype.notify = function(event) {
  this._ipc.notify.apply(this._ipc, arguments);
};

var stub = null,
    dataTrans = null;
exports.getStub = function(dataTrans_) {
  if(stub == null) {
    stub = new Stub();
    dataTrans = dataTrans_;
  }
  return stub;
}

