import Vue from 'vue'
import App from './App.vue'
import router from './router'
// import store from './store'
import vuetify from './plugins/vuetify';
import axios from 'axios';

Vue.config.productionTip = false;
axios.defaults.baseURL = process.env.VUE_APP_URL_SCONTRINI;
axios.defaults.headers.common['Authorization'] = 'Basic ' + btoa(process.env.VUE_APP_MY_ACCOUNT);
axios.defaults.headers.get['Content-Type'] = 'application/json';


Vue.filter('toGMA', function(val)  {
  // Converte una data ricevuta come YYYY/MM/GG HH:mm in GG/MM/YYYY HH:mm
    return val.substr(8,2) + val.substr(4,4) + val.substr(0,4) + val.substr(10);
  }
);

new Vue({
  router,
//  store,
  vuetify,
  render: h => h(App)
}).$mount('#app');
