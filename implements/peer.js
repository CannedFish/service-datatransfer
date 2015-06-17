var net = require('net'),
    Cache = require('utils').Cache();

function Peer(option) {
  // option initialize
  var op = option || {};
  this._option = {
    port: op.port || 56767,
    onRecive: op.onRecive || function(data) {
      console.log('Data recived:', data + '');
    },
    onError: op.onError || function(err) {
      console.log('Error occured:', err);
    },
    onClose: op.onClose || function(addr) {
      console.log('Connection to', addr, 'ended');
    }
  };
  this._list = [];

  this._init();
}

Peer.prototype._init = function() {
  var self = this,
      op = self._option,
      server = self._server = net.createServer(function(cliSock) {
        self._sockInit(cliSock);
      });

  server.listen(op.port, function() {
    console.log('Data reciver is listening on', server.address());
  });
  server.on('error', function(e) {
    op.onError(e);
  });
}

Peer.prototype.destroy = function() {
  this._server.close();
}

Peer.prototype._sockInit = function(cliSock) {
  // TODO: varify this connection
  var self = this,
      op = self._option;
  self._list[cliSock] = [cliSock.remoteAddress, cliSock.remotePort];
  cliSock.on('data', function(data) {
    // console.log(this.remoteAddress + ':' + this.remotePort + ' sends: ', data);
    // TODO: completeness validate
    // TODO: packet
    op.onRecive(data, this);
  }).on('error', function(err) {
    op.onError(err);
  }).on('end', function() {
    op.onClose(self._list[cliSock][0] + ':' + self._list[cliSock][1]);
    self._list[cliSock] = null;
    delete self._list[cliSock];
  });
}

// tricky func name 
Peer.prototype.writablePeerStream
  = Peer.prototype.readablePeerStream
  = Peer.prototype.peerStream = function(addr, callback) {
  var self = this,
      op = self._option,
      cb = callback || function() {},
      cliSock = null;
  // TODO: maybe cache the connection
  try {
    cliSock = net.connect(op.port, addr, function() {
      // self._sockInit(cliSock);
      cb(null, cliSock);
    });
  } catch(e) {
    cb(e + '');
  }
}

var peer = null;
exports.instance = function(option) {
  if(peer == null) {
    peer = new Peer(option);
  }
  return peer;
}

exports.release = function() {
  if(peer != null) {
    peer.destroy();
    peer = null;
  }
}

