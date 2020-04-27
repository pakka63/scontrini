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

function sendCassa(txt) {
  let strData = '000' + txt;
  strData = sSTX + strData + faiCKS(strData) + sETX;
  client.write(strData);
}

let server = []
if(process.argv.length >2) {
  server = process.argv[2].split(':');
}
if(server.length == 0) {
  server[0]='192.168.1.133';
}
if(server.length == 1) {
  server[1]=9100;
}
let dataBuff = Buffer.alloc(0);

console.log('Mi collego con ' + server[0] + ':' +server[1] + ' ....');
const client = net.createConnection(server[1], server[0], () => {
  // Check Stato Cassa
  console.log('Connesso!');
  sendCassa('1109');
});

client.on('end', () => {
  console.log('Disconnesso. Fine test.');
  process.exit(0);
});

client.on('data', (buffer) =>{
  if(buffer[0] == nNAK) {
    msgErrore = 'KO Ricevuto NAK da XCUBE';
    client.end(sACK);
    return;
  }

  dataBuff = Buffer.concat([dataBuff, buffer]);
  if(dataBuff[dataBuff.length -1] != nETX ) {
    // aspetto altri dati.. (mettere un timer...)
    return;
  }
  // Ho finito la lettura, devo decodificare la risposta
  for (const value of dataBuff.values()) {
    console.log(value);
  }
  client.end();
  return;
});

