var proxy = require('../interface/dataTransferProxy').getProxy();

// hang on some events' handler

function cpCallback(ret) {
  if(ret.err) {
    return console.log(ret.err);
  }
  console.log('File transferring...');
}

if(process.argv[2] == 'l2r') {
  // test from local to remote
  proxy.cpFile('/home/lgy/t.iso', '127.0.0.1:/home/lgy/t1.iso', cpCallback);
} else if(process.argv[2] == 'r2l') {
  // test from remote to local
  proxy.cpFile('127.0.0.1:/home/lgy/t.iso', '/home/lgy/t1.iso', cpCallback);
} else if(process.argv[2] == 'l2l') {
  proxy.cpFile('/home/lgy/t.iso', '/home/lgy/t1.iso', cpCallback);
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

