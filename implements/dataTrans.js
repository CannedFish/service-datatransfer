var net = require('net'),
    fs = require('fs'),
    event = require('event'),
    util = require('util');

function DataTrans() {
  // TODO: inherit from event
  this._peer = require('./peer').instance({
    onRecive: this._onRecive,
    onError: this._onError,
    onClose: this._onClose
  });
}

DataTrans.prototype._cpFileFromRemote(src, dst, stream, callback) {
  var total = 0,
      now = 0,
      fileStream = fs.createWriteStream(dst),
      cb = callback || function() {};

  fileStream.on('data', function(data) {
    now += data.length;
    // TODO: onProgress
  }).on('error', function(err) {
    cb(err);
  }).on('end', function() {
    cb(null);
  });

  stream.once('data', function(data) {
    total = parseInt(data + '');
    if(total > 0) {
      stream.pipe(fileStream);
      stream.write('start:' + src);
    }
  }).on('error', function(e) {
    cb(err);
  }).on('end', function() {
    console.log('stream close');
  });
  stream.write('recvreq:' + src);
}

DataTrans.prototype.cpFile = function(srcDir, dstDir, callback) {
  var src = srcDir.split(':'),
      dst = dstDir.split(':'),
      cb = callback || function() {},
      self = this,
      peer = self._peer;
  // Not support for coping from one remote to the other remote.
  if(typeof src[1] !== 'undefined' && typeof dst[1] !== 'undefined')
    return cb('One of src and dst must be local path');

  // copy from remote to local
  if(net.isIP(src[0])) {
    peer.readablePeerStream(src[0], function(err, stream) {
      if(err) return cb(err);
      self._cpFileFromRemote(src[1], dst[0], stream, cb);
    });
  } else if(net.isIP(dst[0])) {
    // copy from local to remote
    peer.writablePeerStream(dst[0], function(err, stream) {
      if(err) return cb(err);
      stream.write('sendreq:' + src[0] + ':' + dst[1]);
    });
  } else {
    // copy from local to local
  }
}

DataTrans.prototype._onRecive = function(data, writableStream) {
  var proto = (data + '').split(':'),
      self = this;
  switch(proto[0]) {
    case 'sendreq':
      self._cpFileFromRemote(proto[1], proto[2], writableStream, function(err) {
        if(err) console.log('sendreq error:', err);
      });
      break;
    case 'recvreq':
      var path = proto[1];
      fs.stat(path, function(err, stats) {
        if(err) {
          writableStream.write('error:' + err);
          return writablePeerStream.close();
        }
        writablePeerStream.write(stats.size + '');
      });
      break;
    case 'start':
      var fileStream = fs.createReadStream(proto[1]);
      fileStream.pipe(writableStream);
      fileStream.on('data', function(data) {
        // TODO: onProgress
      }).on('error', function(err) {
        self._onError(err);
      });
      break;
    case 'error':
      self._onError(proto[1]);
      break;
    default:
      console.log('Unknown:', proto[0]);
  }
}

DataTrans.proto._onError = function(err) {
  console.log('onError:', err);
}

