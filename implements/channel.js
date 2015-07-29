var net = require('net'),
    os = require('os'),
    uuid = require('node-uuid'),
    proto = require('./proto'),
    noop = function() {},
    localServName = uuid.v1(),
    localServPath = os.tmpdir() + '/' + localServName + '.sock',
    localServ = null;

exports.getChannel = function(target, callback) {
  var cb = callback || noop;
  // TODO: check authentication
  return cb(null, localServPath);
}

exports.localServerStart = function(callback) {
  var cb = callback || noop;
  if(localServ != null) return ;
  localServ = net.createServer(function(channel) {
    channel.id = uuid.v1();
    // TODO: put this channel in channels' src channel
    proto.tunnelInsert(channel.id, [channel]);
    channel.on('data', function(chuck) {
      proto.parse(this, (chuck + '').split(':'));
    });
  });
  localServ.listen(localServPath, function() {
    console.log('DataTransfer\'s channel is listening on ' + localServPath);
  });
  cb(null);
}

