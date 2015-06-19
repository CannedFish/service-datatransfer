var net = require('net'),
    fs = require('fs'),
    events = require('events'),
    util = require('util');

// Buffer size = 65536 = 2^16, Buffer size * Threshold = 2 ^ 20 * 10 = 10M
var THRESHOLD = 160,
    fList = [];

function DataTrans() {
  events.EventEmitter.call(this);

  this._peer = require('./peer').instance({
    onRecive: this._onRecive,
    onError: this._onError,
    onClose: this._onClose
  });
}
util.inherits(DataTrans, events.EventEmitter);

function stream2Stream(rStream, wStream, param) {
  var total = param.total,
      now = param.now,
      threshold = THRESHOLD,
      evProgress = 'progress#' + param.src,
      evError = 'error#' + param.src,
      evEnd = 'end#' + param.src,
      dir = param.dir;

  rStream.on('data', function(data) {
    now += data.length;
    // onProgress
    if(--threshold == 0) {
      stub.notify(evProgress, (now / total + '').substr(2, 2), dir);
      threshold = THRESHOLD;
    }
  }).on('error', function(e) {
    // emit error
    console.log(e);
  }).on('end', function() {
    // emit end
    if(now == total) {
      // TODO: md5 check
      stub.notify(evProgress, 100, dir);
      stub.notify(evEnd, 0);
      console.log('file transmission succefully');
    } else {
      console.log('transmission stopped');
    }
  });
}

function cpFileFromRemote(src, dst, stream, callback) {
  var total = 0,
      fileStream = fs.createWriteStream(dst),
      cb = callback || function() {};

  fileStream.on('error', function(err) {
    cb(err);
  }).on('end', function() {
    console.log(dst, 'recives completely');
  });

  stream.on('data', function(data) {
    total = parseInt(data + '');
    if(total > 0) {
      stream.removeAllListeners('data')
        .removeAllListeners('error')
        .removeAllListeners('end');
      stream2Stream(stream, fileStream, {
        total: total,
        now: 0,
        src: src,
        dir: 'recive'
      });
      stream.pipe(fileStream);
      stream.write('start:' + src);
      cb(null);
    } else {
      // TODO: handle error
    }
  }).on('error', function(e) {
    cb(err);
  }).on('end', function() {
    console.log('stream closed');
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
      cpFileFromRemote(src[1], dst[0], stream, cb);
    });
  } else if(net.isIP(dst[0])) {
    // copy from local to remote
    peer.writablePeerStream(dst[0], function(err, stream) {
      if(err) return cb(err);
      stream.on('data', function(data) {
        self._onRecive(data, this);
      }).on('error', function(e) {
        self._onError(e);
      });
      stream.write('sendreq:' + src[0] + ':' + dst[1]);
      cb(null);
    });
  } else {
    // copy from local to local
    fs.stat(src[0], function(err, stats) {
      if(err) return cb(err);
      var srcStream = fs.createReadStream(src[0]),
          dstStream = fs.createWriteStream(dst[0]),
          param = {
            total: stats.size,
            now: 0,
            src: src[0],
            dir: 'copy'
          };
      stream2Stream(srcStream, dstStream, param);
      dstStream.on('error', function(e) {
        // emit error
        console.log(e);
      });
      cb(null);
      srcStream.pipe(dstStream);
    });
  }
}

DataTrans.prototype._onRecive = function(data, writableStream) {
  var proto = (data + '').split(':'),
      self = dt;
  switch(proto[0]) {
    case 'sendreq':
      // TODO: make sure there is no problem!! or call cpFile directly.
      cpFileFromRemote(proto[1], proto[2], writableStream, function(err) {
        if(err) console.log('sendreq error:', err);
      });
      break;
    case 'recvreq':
      var path = proto[1];
      fs.stat(path, function(err, stats) {
        if(err) {
          writableStream.write('error:' + err);
          return writableStream.close();
        }
        fList[path] = {
          total: stats.size,
          now: 0,
          src: proto[1],
          dir: 'send'
        };
        writableStream.write(stats.size + '');
      });
      break;
    case 'start':
      // TODO: Not auto close
      var fileStream = fs.createReadStream(proto[1]);
      fileStream.pipe(writableStream);
      stream2Stream(fileStream, writableStream, fList[proto[1]]);
      break;
    case 'error':
      self._onError(proto[1]);
      break;
    default:
      console.log('Unknown:', proto[0]);
  }
}

DataTrans.prototype._onError = function(err) {
  console.log('onError:', err);
}

var dt = null,
    stub = null;
if(dt == null) {
  dt = new DataTrans();
  stub = require('../interface/dataTransferStub').getStub(dt);
}

module.exports = dt;

