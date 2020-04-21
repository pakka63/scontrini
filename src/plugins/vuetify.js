//import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader

import Vue from 'vue';
import Vuetify from 'vuetify/lib';

Vue.use(Vuetify);

export default new Vuetify({

//    https://vuetifyjs.com/en/customization/theme/#custom-properties
    theme: {
        options: {
            customProperties: true,
        },
    },
});
