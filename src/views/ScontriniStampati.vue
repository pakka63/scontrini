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
        sort-by="updated_at"
        sort-desc
        @item-selected="itemSelected"
        @toggle-select-all="itemSelectAll"

      >
        <template #no-data>
          <v-alert class="font-weight-regular" :value="true" color="blue-grey" dark dense >Nessun Dato disponibile</v-alert>
        </template>
        <template #item.updated_at="{ value }">{{ value | toGMA }}</template>
        <template #item.created_at="{ value }">{{ value | toGMA }}</template>
        <template #item.errore="{ value }"><span class="red--text darken-3">{{ value }}</span></template>
        <template #footer><div style="height:0"><v-btn :disabled="btnDisabled" class="pa-3 ml-5 mt-3 primary">Invia a SAP</v-btn></div></template>
      </v-data-table>
    </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'ScontriniStampati',
  data() {
    return {
      loading: true,
      rows: [],
      selected: [],
      btnDisabled: true,
    }
  },

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
    getPosts(section) {
      axios.get(section)
        .then(res => {
          this.rows=res.data;
          this.loading=false;
        })
        .catch(error => console.log(error))
    },
    itemSelected(chk) {
      if(chk.value) {
        this.btnDisabled = false;
      } else {
        // é stato disattivato il checkbox, se non ci sono altre row, disattivo il bottone
        this.btnDisabled = this.selected.length < 2;
      }
    },
    itemSelectAll(chk) {
      this.btnDisabled = !chk.value;
    }
  },

  created() {
    this.getPosts('scontriniStampati');
  }

}
</script>
