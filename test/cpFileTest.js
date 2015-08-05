var proxy = require('../interface/datatransferProxy').getProxy(),
    src = process.env.HOME + '/t.iso',
    dst = process.env.HOME + '/t1.iso',
    ip = '127.0.0.1';

function cpCallback(ret) {
  if(ret.err) {
    return console.log(ret.err);
  }
  var sessionID = ret.ret;
  // console.log(sessionID);
  // hang on some events' handler
  proxy.on('progress#' + sessionID, function(percentage, msg) {
    console.log('Progress:', percentage + '%', msg);
  }).on('error#' + sessionID, function(err) {
    console.log('Error:', err);
  }).on('end#' + sessionID, function(err) {
    if(err) return console.log(err);
    console.log('Transmission OK!');
    clearTimeout(to);
    proxy.status(sessionID, function(ret) {
      console.log(ret);
    });
  });
  console.log('File transferring...');
  var to = setTimeout(function() {
    proxy.status(sessionID, function(ret) {
      console.log(ret);
    });
  }, 2000);

  // cancel test
  setTimeout(function() {
    proxy.cancel(sessionID, function(ret) {
      if(ret.err) return console.log(ret.err);
      console.log('File transmission canceled.');
    });
    proxy.status(sessionID, function(ret) {
      console.log(ret);
    });
  }, 4000);
}

if(process.argv[2] == 'l2r') {
  // test from local to remote
  proxy.cpFile(src, ip + ':' + dst, cpCallback);
} else if(process.argv[2] == 'r2l') {
  // test from remote to local
  proxy.cpFile(ip + ':' + src, dst, cpCallback);
  proxy.on('request', function(req) {
    if(req.type == 'recvreq' && req.src == src) {
      var key = req.sessionID;
      setTimeout(function() {
        // proxy.cancel(key);
      }, 2000);
    }
  });
} else if(process.argv[2] == 'l2l') {
  proxy.cpFile(src, dst, cpCallback);
} else {
  if(process.argv.length != 4) {
    console.log('Usage: node cpFileTest.js $(l2r|r2l|l2l)');
    console.log('                          $PathToSrcFile $PathToDstFile');
    console.log('e.g. node cpFileTest.js r2l');
    console.log('  or node cpFileTest.js path_to_src_file path_to_dst_file');
    return ;
  }
  proxy.cpFile(process.argv[2], process.argv[3], cpCallback);
}

