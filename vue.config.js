module.exports = {
  // Per problemi con CORS, se vuoi vedere i preflight disattiva questo  chrome://flags/#out-of-blink-cors
  // Il problema CORS che avevo era causato dal fatto che il preflight viene richiesto senza password...e quindi rifiutato
  // Ho modificato la confing su Apache per consentirlo
  devServer: {
    //In teoria questo fa il proxy in accesso al server di sviluppo.. 
    //https://medium.com/js-dojo/how-to-deal-with-cors-error-on-vue-cli-3-d78c024ce8d3
    //In sostanza sostituire al server reale "localhost:8080" e mettere il server reale qui
    proxy: 'http://keeper.test/',
    // E' possibile una gesione più sofisticata come scritto qui: https://cli.vuejs.org/config/#devserver-proxy
  },
  "transpileDependencies": [
    "vuetify"
  ],
/* non funziona, non usato...
  css: {
    loaderOptions: {
      sass: {
        sassOptions: {
          data: `@import "@/styles/style.scss";`
        }
      }
    }
  }
*/
}