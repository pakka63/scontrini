<template>
  <div class="nuovi">
    <v-data-table
        v-model="selected"
        :headers="headers"
        :items="rows"
        item-key="id"
        show-select
        class="elevation-1"
      >
        <template v-slot:top>
          <v-btn class="pa-3">Stampa</v-btn>
        </template>
        <template v-slot:item.created_at="{ item }">{{ item.created_at | toGMA }}</template>
      </v-data-table>
    </div>
</template>

<script>
// @ is an alias to /src
//import HelloWorld from '@/components/HelloWorld.vue'
import axios from 'axios';

export default {
  name: 'ScontriniNuovi',
  components: {
//    HelloWorld
  },
  data() {
    return {
      rows: [],
      selected: [],
        headers: [
        {
          text: 'Dessert (100g serving)',
          align: 'start',
          sortable: false,
          value: 'name',
        },
        { text: 'Documento', value: 'id_documento' },
        { text: 'Emesso', value: 'created_at' },
        { text: 'Prezzo', value: 'prezzo' },
      ],
    }
  },

  created() {
    this.getPosts('scontriniNuovi');
  },
  methods: {
    getPosts(section) {
      axios.get(section)
        .then(res => {
          this.rows=res.data;

          console.log(this.rows);
        })
        .catch(error => console.log(error))
    }
  }

}
</script>
