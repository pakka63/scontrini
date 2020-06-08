<template>
  <div class="nuovi">
    <v-data-table
        dense
        height="543"
        fixed-header
        v-model="selected"
        :headers="headers"
        :items="rows"
        item-key="id"
        show-select
        class="elevation-1"
        :loading="loading"
        loading-text="Lettura dati... Attendere"
        :footer-props="footerProps"
        :itemsPerPage="itemsPerPage"
        :page="page"
        sort-by="created_at"
        @item-selected="itemSelected"
        @toggle-select-all="itemSelectAll"
        @pagination="checkPagination"
      >
        <template #item.prezzo="{ value }">{{ value | toEuro }}</template>
        <template #item.created_at="{ value }">{{ value | toGMA }}</template>
        <template #item.errore="{ value }"><span class="red--text darken-3">{{ value }}</span></template>
        <template #no-data>
          <v-alert 
            class="font-weight-regular"
            :value="true" color="blue-grey" dark dense
          >Nessun Dato disponibile
        </v-alert>
        </template>
        <template #footer>
          <div style="height:0"><v-btn :disabled="btnDisabled" class="pa-3 ml-5 mt-3 primary" @click="stampaScontrini">Stampa Scontrini</v-btn>
            <v-tooltip bottom>
              <template v-slot:activator="{ on }">
                  <v-btn class="mt-3 ml-5" outlined v-on="on" color="primary" @click="reload">
                    <v-icon>mdi-refresh</v-icon>
                </v-btn>
              </template>
              <span>Rileggi i dati</span>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </div>
</template>

<script>
// @ is an alias to /src
//import HelloWorld from '@/components/HelloWorld.vue'
import axios from 'axios';
import { nuovi } from '@/store.js';
/*
 import { remote } from 'electron';
const {dialog} = remote;
 */

function isElectron() {
  return (typeof process !== "undefined") && process.versions && (process.versions.electron !== undefined);
}
let ipcRenderer = null;
let showError = function (...args) { alert( args.toString())};
if(isElectron()) {
  const electron = require('electron');
  const dialog = electron.remote.dialog;
  showError = dialog.showErrorBox;
  ipcRenderer = electron.ipcRenderer;
//  import { ipcRenderer } from 'electron';
}

export default {
  name: 'ScontriniNuovi',
  data() {
    return {
      loading: true,
      rows: nuovi.scontrini,
      selected: [],
      btnStampaDisabled: true,
      itemsPerPage: nuovi.itemsPerPage,
      page: nuovi.currentPage,
    }
  },
  props: ['test'],
  computed : {
    btnDisabled() {
      return  !isElectron() || this.btnStampaDisabled;
    },
    headers() {
      return [
        { text: 'Documento', value: 'id_documento'},
        { text: 'Testo', value: 'testo'},
        { text: 'Prezzo €', value: 'prezzo', align: 'end'},
        { text: 'Ricevuto', value: 'created_at', align : 'center'},
        { text: 'Anomalie', value: 'errore'},
      ]
    },
    footerProps() {
      return {
        itemsPerPageOptions: [20,50,-1],
        itemsPerPageText: "Righe per pagina:",
        itemsPerPageAllText: "Tutte",
        pageText: "{0}-{1} di {2}"
      }
    }
  },

  methods: {
    getPosts() {
      this.loading = (this.rows.length == 0);
      if(this.rows.length == 0) {
        axios.get('scontriniNuovi'+(this.test? '?test=1':''))
          .then(res => {
            this.rows = nuovi.scontrini = res.data;
            this.loading=false;
          })
          .catch(error => {
            showError('Errore in lettura', error.toString());
          })
      } else {
        this.itemsPerPage = nuovi.itemsPerPage;
        this.page = nuovi.currentPage;
      }
    },
    itemSelected(chk) {
      if(chk.value) {
        this.btnStampaDisabled = false;
      } else {
        // é stato disattivato il checkbox, se non ci sono altre row, disattivo il bottone
        this.btnStampaDisabled = this.selected.length < 2;
      }
    },
    itemSelectAll(chk) {
      this.btnStampaDisabled = !chk.value;
    },
    checkPagination(info) {
      nuovi.itemsPerPage = info.itemsPerPage;
      nuovi.currentPage = info.page;
    },
    reload() {
      this.rows = [];
      this.selected = [];
      this.btnStampaDisabled=true;

      this.getPosts();
    },
    stampaScontrini() {
      this.$emit("show-spinner", true);
      if(ipcRenderer) {
        ipcRenderer.send('stampaScontrini', this.selected);
      }
    }
  },

  created() {
    this.getPosts();
    if(isElectron()) {
      ipcRenderer.on('esitoStampa', (event, msg ) => {
        if(msg.substr(0,2) == 'KO') {
          showError('Errore in stampa Scontrini', msg.substr(3));
        }
        this.$emit("show-spinner", false);
        this.reload();
      });
    }
  },
  beforeDestroy() {
    if(isElectron()) {
      ipcRenderer.removeAllListeners('esitoStampa');
    }
  }
}
</script>
