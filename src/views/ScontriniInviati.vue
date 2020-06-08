<template>
  <div class="nuovi">
    <v-data-table
        dense
        height="543"
        fixed-header
        :headers="headers"
        :items="rows"
        item-key="id"
        class="elevation-1"
        :loading="loading"
        loading-text="Lettura dati... Attendere"
        :footer-props="footerProps"
        :itemsPerPage="itemsPerPage"
        :page="page"
        sort-by="updated_at"
        sort-desc
        @pagination="checkPagination"
      >
        <template #no-data>
          <v-alert class="font-weight-regular" :value="true" color="blue-grey" dark dense >Nessun Dato disponibile</v-alert>
        </template>
        <template #item.prezzo="{ value }">{{ value | toEuro }}</template>
        <template #item.updated_at="{ value }">{{ value | toGMA }}</template>
        <template #item.created_at="{ value }">{{ value | toGMA }}</template>
        <template #footer>
          <div style="height:0">
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
import { inviati } from '@/store.js';

export default {
  name: 'ScontriniInviati',
  components: {
//    HelloWorld
  },
  data() {
    return {
      loading: true,
      rows: inviati.scontrini,
      itemsPerPage: inviati.itemsPerPage,
      page: inviati.currentPage,
    }
  },
  props: ['test'],
  computed : {
    headers() {
      return [
        { text: 'Documento', value: 'id_documento' },
        { text: 'Testo', value: 'testo' },
        { text: 'Prezzo €', value: 'prezzo', align: 'end' },
        { text: 'Comunicato', value: 'updated_at', align : 'center' },
        { text: 'Ricevuto', value: 'created_at', align : 'center' },
      ]
    },

    footerProps() {
      return {
        itemsPerPageOptions: [50,-1],
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
        axios.get('scontriniInviati'+(this.test? '?test=1':''))
          .then(res => {
            this.rows = inviati.scontrini=res.data;
            this.loading=false;
          })
          .catch(error => console.log(error))
      } else {
        this.itemsPerPage = inviati.itemsPerPage;
        this.page = inviati.currentPage;
      }
    },
    checkPagination(info) {
      inviati.itemsPerPage = info.itemsPerPage;
      inviati.currentPage = info.page;
    },
    reload() {
      this.rows = [];
      this.selected = [];
      this.getPosts();
    },

  },

  created() {
    this.getPosts();
  },
}
</script>
