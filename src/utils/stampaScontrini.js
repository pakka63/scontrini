const net = require('net');
//const util = require('util');

const sSTX = '\x02';
const nSTX = 2;
const sETX = '\x03';
const nETX = 3;
const sACK = '\x06';
const nACK = 6;
const sNAK = '\x15';
const nNAK = 21;

var counter = -1;
var dataBuff = Buffer.alloc(0);

function emettiScontrini(server, lista, evt) {
  let msgErrore = '';
  let idxScontrino; // stato comunicazione con la cassa: -1 info, 0-n emisione scontrino.

  const ipcEvent = evt;
  const listaScontrini = lista;
  const client = net.createConnection(server.port, server.address, () => {
    // Check Stato Cassa
    sendCassa('1109');
  });

  function sendCassa(txt) {
    if(++counter > 99) {
      counter = 0;
    }
    let strData = counter.toString().padStart(2,'0') + '0' + txt;
    strData = sSTX + strData + faiCKS(strData) + sETX;
    client.write(strData);
  }

  function faiCKS(str) {
    let result = 0, l =str.lenght;
    while(l >= 0) {
      result += str.charCodeAt(--l);
    }
    result %= 100;
    if(result > 9) {
      return result.toString();
    }
    return '0' + result.toString();
  }

  function decodeResponse(buffer) {
    let ll=buffer.length;
    //ACK+STX+counter+0+cmd+result+cks+ETX

    if (buffer[0] != nACK) {
      msgErrore = 'KO primo carattere non è ACK:' + buffer[0].toString();
      return false;
    }
    if (buffer[1] != nSTX) {
      msgErrore = 'KO secondo carattere non è STX:' + buffer[1].toString();
      return false;
    }
    let csum = buffer.toString('ascii', ll-2, ll-1);
    let cks = faiCKS(buffer.toString('ascii',2, ll-3));
    if(csum != cks) {
      msgErrore = 'KO checksum errato:' + csum + '-' + cks;
      return false;
    }
    if(buffer.toString('ascii', 5, 8) == 'ERR') {
      return '0000' + buffer.toString('ascii', 5, 10);
    }
    return buffer.toString('ascii', 5, ll -3);
  }

  function isPrinterOK(txt) {}
    if(txt.charAt(0) == '1') {
      msgErrore = 'KO coperchio aperto, verificare';
      return false;
    }

    if(txt.charAt(1) == '1') {
      msgErrore = 'KO carta esaurita, verificare';
      return false;
    }
/*            
    if(txt.charAt(2) == '1') {
      msgErrore = 'KO carta in esaurimento, verificare';
      return false;
    }
*/            
    if(txt.charAt(3) == '1') {
      msgErrore = 'KO DGFE esaurito, verificare';
      return false;
    }
/*            
    if(txt.charAt(4) == '1') {
      msgErrore = 'KO DGFE in esautimento, verificare.';
      return false;
    }
*/
    return true;
  }

  function inviaScontrino(idx) {
    let descr = (listaScontrini[idx].testo).substr(0,22);
    let ll = (descr.lenght).toString().padStart(2,'0');
    let price = (listaScontrini[idx].prezzo * 100).toString().padStart(9,'0');
    let str = '30011' + ll + descr + price;
    sendCassa(str);
  }

  client.on('data', (buffer) =>{
    if(buffer[0] == nNAK) {
      msgErrore = 'KO Ricevuto NAK da XCUBE';
      client.end(sACK);
      return;
    }
    for (let i = 0; i < buffer.length; i++) {
      if(buffer[i] > 128) {
        buffer[i] = 63; // metto '?'
      }
    }
    dataBuff = Buffer.concat([dataBuff, buffer]);
    if(dataBuff[dataBuff.length -1] != nETX ) {
      // aspetto altri dati.. (mettere un timer...)
      return;
    }
    // Ho finito la lettura, devo decodificare la risposta
    let txt = decodeResponse(dataBuff);
    dataBuff = Buffer.alloc(0); 
    if(txt === false ) {
      client.end();
      return;
    }
    if(txt.substr(0,3) == 'ERR' || txt.substr(4,3) == 'ERR') {
        msgErrore = 'KO ricevuto errore da XCUBE: ' + txt;
        client.end();
        return;
    }

    // Analisi del messagio tornato dalla stampante e conseguente azione successiva
    switch (txt.substr(0,4)) {
      case '1109': // check Stampante
        if (!isPrinterOK(txt.substr(4))) {
          client.end();
          return;
        }
        idxScontrino = 0
        inviaScontrino(idxScontrino);
        break;

      case '3001': // operazione fiscale
        sendcassa('3011');
        break;
      case '3011': // chiusura scontrino
        sendcassa('3013');
        break;
      case '3013': // Espulsione e taglio scontrino
        sendcassa('1008');
        break;
/*        Non si inviano....
      case '1003': // ricezione totale scontrino
      case '1013': // lettura modello stampante
      case '1001': // data ora
*/
      case '1008': // lettura id_fiscale dello scontino
        if(!aggiornaScontrino(idxScontrino,txt.substr(6,8))) {
          msgErrore = 'KO Errore in aggiornamento scontrino :' + txt.substr(6,8);
          client.end();
          return;
        }
        if(++idxScontrino < listaScontrini.length) {
          inviaScontrino(idxScontrino);
        }
        // Se sono qui ho finito la lista scontrini
        client.end();
        return;
      break;
    } // switch
});

  client.on('end', () => {
    if (msgErrore > '') {
      ipcEvent.reply('esitoStampa', msgErrore);
    } else {
      ipcEvent.reply('esitoStampa', 'OK');
    }
  });

}



module.exports.emettiScontrini = emettiScontrini;
