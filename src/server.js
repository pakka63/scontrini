const net = require('net');
const sSTX = '\x02';
const nSTX = 2;
const sETX = '\x03';
const nETX = 3;
const sACK = '\x06';
const nACK = 6;
const sNAK = '\x15';
const nNAK = 21;

function faiCKS(str) {
  let result = 0, l = str.length;
  while(l > 0) {
    result += str.charCodeAt(--l);
  }
  result %= 100;
  return result.toString().padStart(2,'0');
}

const server = net.createServer((socket) => {
  let closing = false;
  // 'connection' listener.
  console.log('client connected from ' + socket.remoteAddress + ':' + socket.remotePort);
  socket.on('end', () => {
    console.log('client disconnected');
  });
  let dataBuff = Buffer.alloc(0);
  socket.on('data', (buffer) => {
    dataBuff = Buffer.concat([dataBuff, buffer]);
    if(dataBuff[dataBuff.length -1] != nETX ) {
      // aspetto altri dati.. (mettere un timer...)
      return;
    }
    //STX+counter+0+cmd+result+cks+ETX
    console.log('data:[' + dataBuff.toString() + ']');
    let ll=dataBuff.length;
    let csum = dataBuff.toString('ascii', ll-3, ll-1);
    let payLoad = dataBuff.toString('ascii',1, ll-3);
    let cks = faiCKS(payLoad);
    if(csum != cks) {
      console.log('KO checksum errato:' + csum + '-' + cks);
      socket.write(sNAK);
    }
    let cmd = dataBuff.toString('ascii',4,8);
    let response = payLoad;
    switch (cmd) {
      case '1109':
        response += '00000';
        break;
    }
    dataBuff = Buffer.alloc(0);
    response = sACK+sSTX+response+faiCKS(response)+sETX;
    socket.write(response);
  });
});
server.on('error', (err) => {
  console.log(err) ;
});
server.listen(3500, () => {
  console.log('server in ascolto su ', server.address().port);
});
