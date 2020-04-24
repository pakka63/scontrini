<template>
  <v-app>
    <v-app-bar
      app
      color="primary"
      dark
    >
      <div class="d-flex align-center">
        <v-toolbar-title class="display-1">
        <v-icon class="mr-2" x-large>mdi-cash-register</v-icon>
          {{ title }}</v-toolbar-title>
      </div>

      <v-spacer></v-spacer>
      <v-btn text class="mr-2" active to="/">Nuovi</v-btn>
      <v-btn text class="mr-2" to="/stampati">Stampati</v-btn> 
      <v-btn text to="/storico">Storico</v-btn>
    </v-app-bar>

    <v-content>
      <transition name="slide-appear" mode="out-in">
        <router-view/>
      </transition>
    </v-content>
    <v-footer padless >
    <v-col
      class="text-center"
      cols="12"
    >
      {{ new Date().getFullYear() }} — <strong>EDP Progetti S.r.l.</strong>
    </v-col>
  </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'App',
  data: () => ({
    title: process.env.VUE_APP_TITLE
    //
  }),
};
</script>

<style>
  .v-data-footer {
    margin-right: 0 !important;
    background-color: var(--v-accent-lighten2);
  }
  tr.v-data-table__empty-wrapper td {
    font-weight: bolder;
    color: #000;
    padding-top: 20px;
  }
  .slide-appear-enter { opacity: 0; width:100%; }
  .slide-appear-enter-to { opacity: 1; width:100%; }

  .slide-appear-leave { transform: translateX(0);}
  .slide-appear-leave-to { transform: translateX(-100%);}
  
  .slide-appear-enter-active { transition: all 200ms}
  .slide-appear-leave-active { transition: all 400ms}
</style>