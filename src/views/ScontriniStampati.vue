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
        sort-by="updated_at"
        sort-desc
        @item-selected="itemSelected"
        @toggle-select-all="itemSelectAll"
        @pagination="checkPagination"

      >
        <template #no-data>
          <v-alert class="font-weight-regular" :value="true" color="blue-grey" dark dense >Nessun Dato disponibile</v-alert>
        </template>
        <template #item.prezzo="{ value }">{{ value | toEuro }}</template>
        <template #item.updated_at="{ value }">{{ value | toGMA }}</template>
        <template #item.created_at="{ value }">{{ value | toGMA }}</template>
        <template #item.errore="{ value }"><span class="red--text darken-3">{{ value }}</span></template>
        <template #footer>
          <div style="height:0">
            <v-btn :disabled="btnInvioDisabled" class="pa-3 ml-5 mt-3 primary" @click="inviaScontrini">Invia a SAP</v-btn>
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
import axios from 'axios';
import { stampati, inviati } from '@/store.js';
/*
  import { remote } from 'electron';
  const {dialog} = remote;
*/
function isElectron() {
  return (typeof process !== "undefined") && process.versions && (process.versions.electron !== undefined);
}

let showError = function (...args) { alert(args.join('\n'))};
if(isElectron()) {
  const electron = require('electron');
  const dialog = electron.remote.dialog;
  showError = dialog.showErrorBox;
}

export default {
  name: 'ScontriniStampati',
  data() {
    return {
      loading: true,
      rows: stampati.scontrini,
      selected: [],
      btnInvioDisabled: true,
      itemsPerPage: stampati.itemsPerPage,
      page: stampati.currentPage,
    }
  },
  props: ['test'],
  computed : {
    headers() {
      return [
        { text: 'Documento', value: 'id_documento' },
        { text: 'Testo', value: 'testo' },
        { text: 'Prezzo €', value: 'prezzo', align: 'end' },
        { text: 'Stampato', value: 'updated_at', align : 'center' },
        { text: 'Ricevuto', value: 'created_at', align : 'center' },
        { text: 'Anomalie', value: 'errore'},
      ]
    },

    footerProps() {
      return {
        itemsPerPageOptions: [20,50,-1],
        itemsPerPageText: "Righe per pagina:",
        itemsPerPageAllText: "Tutte",
        pageText: "{0}-{1} di {2}"
      };
    }
  },

  methods: {
    getPosts() {
      this.loading = (this.rows.length == 0);
      if(this.rows.length == 0) {
        axios.get('scontriniStampati'+(this.test? '?test=1':''))
          .then(res => {
            this.rows = stampati.scontrini=res.data;
            inviati.scontrini=[];
            this.loading=false;
          })
          .catch(error => showError('Errore in lettura', error.message))
      } else {
        this.itemsPerPage = stampati.itemsPerPage;
        this.page = stampati.currentPage;
      }
    },
    itemSelected(chk) {
      if(chk.value) {
        this.btnInvioDisabled = false;
      } else {
        // é stato disattivato il checkbox, se non ci sono altre row, disattivo il bottone
        this.btnInvioDisabled = this.selected.length < 2;
      }
    },
    itemSelectAll(chk) {
      this.btnInvioDisabled = !chk.value;
    },
    checkPagination(info) {
      stampati.itemsPerPage = info.itemsPerPage;
      stampati.currentPage = info.page;
    },
    reload() {
      this.rows = [];
      this.selected = [];
      this.btnInvioDisabled=true;
      this.$emit("show-spinner", false);

      this.getPosts();
    },
    inviaScontrini() {
      this.$emit("show-spinner", true);

      let lista = this.selected.map( a => {
        return { id: a['id'] }
      });

      axios.post('inviaScontrini', { tickets: lista })
        .then(res => {
          console.log(res);
          this.reload();
        })
        .catch(err => {
            showError('Errore in lettura: ', err.message + '\n' + ( err.response.data.error ?? '') );
            this.reload();
        });
    }

  },

  created() {
    this.getPosts();
  }

}
</script>
