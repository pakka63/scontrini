const net = require('net');

const server = net.createServer((socket) => {
  let closing = false;
  // 'connection' listener.
  console.log('client connected from ' + socket.remoteAddress + ':' + socket.remotePort);
  socket.on('end', () => {
    console.log('client disconnected');
  });
  socket.on('data', (buff) => {
    console.log('data:[' + buff.toString() + ']', buff[0]);
    if(closing==false) {
      if(buff[0] == 3) {
        console.log('closing...');
        closing=true;
        socket.end('bye');
      } else {
        socket.write('data:[' + buff + ']\r\n');
      }
    }
    
  });
  socket.write('hello\r\n');
});
server.on('error', (err) => {
  console.log(err) ;
});
server.listen(3500, () => {
  console.log('server in ascolto su ', server.address());
});
