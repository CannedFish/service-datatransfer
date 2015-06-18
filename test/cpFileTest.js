var proxy = require('../interface/dataTransferProxy').getProxy(),
    src = '/home/lgy/t.iso',
    dst = '/home/lgy/t1.iso',
    ip = '127.0.0.1';

// hang on some events' handler
proxy.on('progress#' + src, function(percentage, dir) {
  console.log('Progress:', percentage + '%', dir);
}).on('error#' + src, function(err) {
  console.log('Error:', err);
}).on('end#' + src, function(err) {
  if(err) return console.log(err);
  console.log('Transmission OK!');
});

function cpCallback(ret) {
  if(ret.err) {
    return console.log(ret.err);
  }
  console.log('File transferring...');
}

if(process.argv[2] == 'l2r') {
  // test from local to remote
  proxy.cpFile(src, ip + ':' + dst, cpCallback);
} else if(process.argv[2] == 'r2l') {
  // test from remote to local
  proxy.cpFile(ip + ':' + src, dst, cpCallback);
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

