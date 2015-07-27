var net = require('net'),
    os = require('os'),
    uuid = require('node-uuid'),
    peer = require('./peer'),
    noop = function() {},
    localServPath = os.tmpdir() + '/dc.sock',
    localServ = null,
    channels = [];

function protoParse(channel, msg) {
  switch(msg[0]) {
    case '0': // ConnPeer
      break;
    case '1': // SetID
      break;
    case '2': // binding(client channel & dt's channel)
      break;
    default:
      break;
  }
}

exports.getChannel = function(target, callback) {
  var cb = callback || noop;
  if(target.addr && net.isIP(target.addr)) {
    // TODO: connect to target address
    // TODO: put this channel in channels' src channel
  } else if(target.sessionID) {
    // TODO: get an exited channel based on sessionID
  }
  return cb(null, localServPath, sessionID);
}

exports.localServerStart = function(callback) {
  var cb = callback || noop;
  if(localServ != null) return ;
  localServ = net.createServer(function(channel) {
    channel.id = uuid.v1();
    // TODO: put this channel in channels' src channel
  });
  localServ.listen(localServPath, function() {
    console.log('DataTransfer\'s channel is listening on ' + localServPath);
  });
  cb(null);
}

