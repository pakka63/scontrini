const fs = require('fs');
const path = require('path');

const axios = require('axios');
axios.defaults.baseURL = process.env.VUE_APP_URL_SCONTRINI;
axios.defaults.headers.common['Authorization'] = 'Basic ' + Buffer.from(process.env.VUE_APP_MY_ACCOUNT).toString('base64');
let xdebug = '';
//per abilitare il debug su php: controllare su .env l'url del server ove gira il debugger
//xdebug = "?XDEBUG_SESSION_START=ECLIPSE_DBGP";

/*
Scrive la lista scontrini nella cartella indicata dalla config. I files saranno gestiti in asincrono dall'applicazione EpsonFpMate
l'evento "watcher" piloterà il fine stampa per chiamare l'aggiornamento su laravel (aggiornaScontrino) per marcarlo come stampato
e si continua con la scrittura dello scontrino successivo (inviaScontrino)
Quando la lista di scontrini risulta tutta stampata si esegue la POST a inviaScontrini per passare a SAP la lista degli scontrini stampati
*/
function emettiScontrini(config, lista, evt) {
  const fpMate = config.fpMate;
  const inTest = config.in_test; 
  let idStampante = fpMate.id_stampante;
  let counter = -1;
  let msgErrore = '';
  let fileMonitors = [];
  let idxScontrino; // stato comunicazione con la cassa: -1 info, 0-n emisione scontrino.

  const ipcEvent = evt;
  const listaScontrini = lista;

// attivo funzione che monitora la directory per cambiamenti
  let watcher = fs.watch(fpMate.cartella_esiti_scontrini, (eventType, filename) => {
    //console.log(new Date().toTimeString(),'watch:', eventType, filename);
      if (eventType === 'change') {
      //Cerco il filename nella lista dei files da controllare
      let idx	= fileMonitors.indexOf(filename);
      if(idx >=0) { // trovato
        //console.log(new Date().toTimeString(),`Trovato File ${filename}`);
        let file = path.join(fpMate.cartella_esiti_scontrini, filename);
        const data = fs.readFileSync(file, { encoding: 'utf8', flag: 'r' });
        let idx1 = data.lastIndexOf('ZDocNum=');
        if(idx1 > 0) {
          let idDoc = data.substring(idx1+8).trim();
          //console.log(`DocNum di ${filename}:`, idDoc);
          fileMonitors.splice(idx,1); //Elimino il suo nome dalla lista
          let idScontrino = filename.substr(fpMate.nome_scontrino.length, filename.length - fpMate.nome_scontrino.length -4);
          aggiornaScontrino(idScontrino, idDoc);
        }
      }
    }
  });
  
  
  function creaTestoScontrino(descr, importo) {
    let imp = importo.toString().replace('.', ',');
    return `printerFiscalReceipt
Printer|1
printRecItem|1|${descr}|1|${imp}|1|1
printRecTotal|1|Totale|${imp}|2|3|1`;
  }
  
  //Scrivo lo scontrino nella cartella 
  function scriviScontrino(idx) {
    let id = listaScontrini[idx].id;
    let descr = (listaScontrini[idx].testo).substr(0,22);
    let price = (Math.round(listaScontrini[idx].prezzo * 100)/100);
    
    try {
      const tmpPath = path.join(fpMate.cartella_scontrini, `temp_${id}.txt`);
      const fileScontrino =  path.join(fpMate.cartella_scontrini, fpMate.nome_scontrino + id + fpMate.estensione_scontrino);
      fs.writeFileSync(tmpPath, creaTestoScontrino(descr, price));
      //console.log(new Date().toTimeString(),`File ${tmpPath} scritto con successo!`);
      fileMonitors.push(fpMate.nome_scontrino + id + fpMate.estensione_monitor);
      fs.renameSync(tmpPath, fileScontrino);
      //console.log(new Date().toTimeString(),`creato scontrino ${fileScontrino}`);
    } catch (err) {
      msgErrore = 'Errore durante la gestione del file:' + err.message();
      fineEmissione();
    }
  }
  
  //Parto col primo scontrino
  idxScontrino = 0
  scriviScontrino(idxScontrino);

  //Invia lo scontrino appena stampato al server laravel
  function  aggiornaScontrino(idScontrino, idDoc) {
    axios.post('scontriniStampati'+xdebug,{id: idScontrino, id_scontrino:idDoc, id_printer: idStampante})
      .then(res => {
        if(++idxScontrino < listaScontrini.length) {
          // Scrivo il prossimo scontrino
          scriviScontrino(idxScontrino);
        } else {
          // Ho finito la lista scontrini, adesso segnalo a Laravel 
          // di contattare SAP per l'invio di quelli appena stampati.
          let lista = listaScontrini.map( ticket => {
            return {
              id: ticket['id'],
            }
          })
          // SOSPESO!!
          if(!inTest) {
            axios.post('inviaScontrini'+xdebug,{ tickets: lista, afterPrint: true }) // afterPrint=true => scrive l'errore nel db e non lo segnala
          }
          fineEmissione();
        }
      })
      .catch(err => {
          let txtErr = err.response.data.error ? ': ' + err.response.data.error : '';
          msgErrore = 'KO Errore in aggiornamento scontrino\r\n' + err.message + txtErr;
          fineEmissione();
      });
  } 

  function fineEmissione() {
    watcher.close();
    if (msgErrore > '') {
      ipcEvent.reply('esitoStampa', msgErrore);
    } else {
      ipcEvent.reply('esitoStampa', 'OK');
    }
  };

}

module.exports.emettiScontrini = emettiScontrini;
