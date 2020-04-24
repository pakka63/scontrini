/* programma di test per simulare la stampante XCUBE */
const net = require('net');

const server = net.createServer((socket) => {
    socket.end('goodbye\n');
  }).on('error', (err) => {
    // Handle errors here.
    throw err;
  });
  
  // Grab an arbitrary unused port.
  server.listen(() => {
    console.log('opened server on', server.address());
  });
  