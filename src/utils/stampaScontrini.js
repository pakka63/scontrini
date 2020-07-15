const net = require('net');
const axios = require('axios');
axios.defaults.baseURL = process.env.VUE_APP_URL_SCONTRINI;
axios.defaults.headers.common['Authorization'] = 'Basic ' + Buffer.from(process.env.VUE_APP_MY_ACCOUNT).toString('base64');

//const util = require('util');

const sSTX = '\x02';
const nSTX = 2;
const sETX = '\x03';
const nETX = 3;
const sACK = '\x06';
const nACK = 6;
const sNAK = '\x15';
const nNAK = 21;


function emettiScontrini(server, lista, evt) {
  let dataBuff = Buffer.alloc(0);
  let idStampante = '';
  let counter = -1;
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
    let result = 0, l = str.length;
    while(l > 0) {
      result += str.charCodeAt(--l);
    }
    result %= 100;
    return result.toString().padStart(2,'0');
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
    let csum = buffer.toString('ascii', ll-3, ll-1);
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

  function isPrinterOK(txt) {
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

  //Invio i dati dello scontrino alla stampante
  function inviaScontrino(idx) {
    let descr = (listaScontrini[idx].testo).substr(0,22);
    let txt = '';

    for (let i = 0, l=descr.length; i < l; i++) {
      if(descr.charCodeAt(i) > 127) {
        txt +='?';
      } else {
        txt += descr[i];
      }
    }

    let ll = (txt.length).toString().padStart(2,'0');
    let price = Math.round(listaScontrini[idx].prezzo * 100).toString().padStart(9,'0');
    let str = '30011' + ll + txt + price;
    sendCassa(str);
  }

  //Invia lo scontrino appena stampato al server laravel
  function  aggiornaScontrino(idx) {
    axios.post('scontriniStampati',{id: listaScontrini[idx].id, id_scontrino:listaScontrini[idx].id_scontrino, id_printer: idStampante})
      .then(res => {
        if(++idxScontrino < listaScontrini.length) {
          // Invio in stampa il prossimo scontrino
          inviaScontrino(idxScontrino);
        } else {
          // Ho finito la lista scontrini, adesso segnalo a Laravel 
          // di contattare SAP per l'invio di quelli appena stampati.
          let lista = listaScontrini.map( ticket => {
            return {
              id: ticket['id'],
            }
          })
          axios.post('inviaScontrini',{ tickets: lista, afterPrint: true }) // afterPrint=true => scrive l'errore nel db e non lo segnala
          client.end();
/*
            .then(res => {
              client.end();
            })
            .catch(err => {
              let txtErr = err.response.data.error ? ': ' + err.response.data.error : '';
              msgErrore = 'KO Errore in aggiornamento scontrino\r\n' + err.message + txtErr;
              client.end();
            });
            */
          }
      })
      .catch(err => {
          let txtErr = err.response.data.error ? ': ' + err.response.data.error : '';
          msgErrore = 'KO Errore in aggiornamento scontrino\r\n' + err.message + txtErr;
          client.end();
      });
  } 

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
    let txt = decodeResponse(dataBuff);
    dataBuff = Buffer.alloc(0); 
    if(txt === false ) {
      client.end();
      return;
    }
    if(txt.substr(0,3) == 'ERR' || txt.substr(4,3) == 'ERR') {
        msgErrore = 'KO Ricevuto errore da XCUBE: \r\n' + txt;
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
        sendCassa('3011');
        break;
      case '3011': // chiusura scontrino
        sendCassa('3013');
        break;
      case '3013': // Espulsione e taglio scontrino
        sendCassa('1003');
        break;
      case '1003': // ricezione numero e totale scontrino
        listaScontrini[idxScontrino].id_scontrino = txt.substr(60,4);
        sendCassa('1104');
        break;
      case '1104': // ricezione numero chiusura precedente
        let chiusura = parseInt(txt.substr(4,4),10) + 1;
        chiusura = '0000' + chiusura;
        chiusura = chiusura.substr(chiusura.length -4,4);
        listaScontrini[idxScontrino].id_scontrino = chiusura + '-' + listaScontrini[idxScontrino].id_scontrino;
        sendCassa('1008');
        break;
        
/*        Non si inviano....
      case '1001': // data ora
*/
      case '1008': // lettura id_fiscale della stampante
        idStampante = txt.substr(4,10);
        sendCassa('1013');
        break;
      case '1013': // lettura modello stampante
        idStampante +=  txt.substr(4).trim();
        aggiornaScontrino(idxScontrino);
        idStampante = '';
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
