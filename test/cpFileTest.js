var proxy = require('../interface/dataTransferProxy').getProxy();

proxy.cpFile('127.0.0.1:/home/lgy/t.iso', '/home/lgy/t1.iso', function(ret) {
  if(ret.err) {
    return console.log(ret.err);
  }
  console.log('File transmission...');
});
