const axios = require('axios');
axios.defaults.baseURL = process.env.VUE_APP_URL_SCONTRINI;
axios.defaults.headers.common['Authorization'] = 'Basic ' + Buffer.from(process.env.VUE_APP_MY_ACCOUNT).toString('base64');



function inviaScontrini(lista, evt) {
  let dataBuff = Buffer.alloc(0);
  let counter = -1;
  let msgErrore = '';
  let idxScontrino; // stato comunicazione con la cassa: -1 info, 0-n emisione scontrino.

  const ipcEvent = evt;

  function  aggiornaScontrino(idx,txt) {

    axios.post('inviaScontrini', { tickets: lista })
        .then(res => {
          ipcEvent.reply('esitoStampa', 'OK');
        })
        .catch(err => {
            let txtErr = err.response.data.error ? ': ' + err.response.data.error : '';
            msgErrore = 'KO Errore in aggiornamento scontrino\r\n' + err.message + txtErr;
            client.end();
        });
  } 

}

module.exports.inviaScontrini = inviaScontrini;
