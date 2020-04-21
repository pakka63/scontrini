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
        sort-by="updated_at"
        sort-desc
      >
        <template #item.prezzo="{ value }">{{ value | toEuro }}</template>
        <template #item.updated_at="{ value }">{{ value | toGMA }}</template>
        <template #item.created_at="{ value }">{{ value | toGMA }}</template>
        <template #no-data>
          <v-alert class="font-weight-regular" :value="true" color="blue-grey" dark dense >Nessun Dato disponibile</v-alert>
        </template>
      </v-data-table>
    </div>
</template>

<script>
// @ is an alias to /src
//import HelloWorld from '@/components/HelloWorld.vue'
import axios from 'axios';

export default {
  name: 'ScontriniInviati',
  components: {
//    HelloWorld
  },
  data() {
    return {
      loading: true,
      itemsPerPage: 50,
      rows: [],
    }
  },

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
    getPosts(section) {
      axios.get(section)
        .then(res => {
          this.rows=res.data;
          this.loading=false;
        })
        .catch(error => console.log(error))
    }
  },

  created() {
    this.getPosts('scontriniInviati');
  },
}
</script>
