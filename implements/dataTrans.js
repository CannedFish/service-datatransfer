var net = require('net'),
    fs = require('fs'),
    events = require('events'),
    util = require('util'),
    uuid = require('node-uuid'),
    crypto = require('crypto');

function keygen(baseStr) {
  return crypto.createHash('md5').update(baseStr).digest('hex');
}

// Buffer size = 65536 = 2^16, Buffer size * Threshold = 2^16 * 2^4 * 10 = 10M
var THRESHOLD = 160,
    fList = [],
    sessions = [];

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
      evProgress = 'progress#' + param.key,
      evError = 'error#' + param.key,
      evEnd = 'end#' + param.key,
      dir = param.dir;

  sessions[param.key] = {
    rs: rStream,
    ws: wStream,
    dir: param.dir
  };
  console.log('session key:', param.key, sessions[param.key].dir);
  rStream.on('data', function(data) {
    now += data.length;
    // TODO: md5.update()
    // onProgress
    if(--threshold == 0) {
      stub.notify(evProgress, (now / total + '').substr(2, 2), dir);
      threshold = THRESHOLD;
    }
  }).on('error', function(e) {
    // emit error
    stub.notify(evError, e + '')
  }).on('end', function() {
    // emit end
    if(now == total) {
      stub.notify(evProgress, 100, dir);
      // TODO: md5 check
      stub.notify(evEnd, 0);
      console.log('file transmission succefully');
    } else {
      stub.notify(evError, 'transmission stopped')
    }
  });

  wStream.on('error', function(e) {
    console.log(e)
  });

  rStream.pipe(wStream);
}

function cpFileFromRemote(src, dst, stream, callback) {
  var total = 0,
      fileStream = fs.createWriteStream(dst),
      cb = callback || function() {};

  stream.on('data', function(data) {
    total = parseInt(data + '');
    if(total > 0) {
      stream.removeAllListeners('data')
        .removeAllListeners('error')
        .removeAllListeners('end');
      // var key = keygen(src);
      stream2Stream(stream, fileStream, {
        total: total,
        now: 0,
        key: stream.id,
        dir: 'recive'
      });
      stream.write('start:' + src);
      cb(null, stream.id);
    } else {
      // TODO: handle error
    }
  }).on('error', function(e) {
    cb(err);
  }).on('end', function() {
    console.log('stream closed');
  });
  stream.write('recvreq:' + src + ':' + stream.id);
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
      stream.write('sendreq:' + src[0] + ':' + dst[1] + ':' + stream.id);
      cb(null, stream.id);
    });
  } else {
    // copy from local to local
    fs.stat(src[0], function(err, stats) {
      if(err) return cb(err);
      var srcStream = fs.createReadStream(src[0]),
          dstStream = fs.createWriteStream(dst[0]),
          key = uuid.v1();
          param = {
            total: stats.size,
            now: 0,
            key: key,
            dir: 'copy'
          };
      cb(null, key);
      stream2Stream(srcStream, dstStream, param);
    });
  }
}

// TODO: Not needed now
// function reqNotify(src, key, type) {
  // stub.notify('request', {
    // src: src,
    // sessionID: key,
    // type: type
  // });
// }

DataTrans.prototype._onRecive = function(data, writableStream) {
  var proto = (data + '').split(':'),
      self = dt;
  switch(proto[0]) {
    case 'sendreq':
      // reqNotify(proto[1], writableStream.id, 'sendreq');
      writableStream.id = proto[3];
      cpFileFromRemote(proto[1], proto[2], writableStream, function(err) {
        if(err) console.log('sendreq error:', err);
      });
      break;
    case 'recvreq':
      // reqNotify(proto[1], writableStream.id, 'recvreq');
      writableStream.id = proto[2];
      var path = proto[1];
      // TODO: get md5sum concurrently
      fs.stat(path, function(err, stats) {
        if(err) {
          writableStream.write('error:' + err);
          return writableStream.close();
        }
        fList[path] = {
          total: stats.size,
          now: 0,
          key: writableStream.id,
          dir: 'send'
        };
        writableStream.write(stats.size + '');
      });
      break;
    case 'start':
      // TODO: Not auto close
      var fileStream = fs.createReadStream(proto[1]);
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

