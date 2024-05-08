<template>
  <template v-if="isReady">
    <the-header :class="$route?.name" />
    <div class="container-app">
      <IndexerDelayAlert v-if="!currentNetwork.maintenance && currentNetwork.name === 'mainnet'" />
      <MaintenanceView v-if="currentNetwork.maintenance" />
      <div v-else class="translate-y-[-320px]">
        <router-view />
      </div>
    </div>
    <the-footer />
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";

import { useTitle } from "@vueuse/core";

import IndexerDelayAlert from "@/components/IndexerDelayAlert.vue";
import TheFooter from "@/components/TheFooter.vue";
import TheHeader from "@/components/header/TheHeader.vue";

import useContext from "@/composables/useContext";
import useLocalization from "@/composables/useLocalization";
import useRouteTitle from "@/composables/useRouteTitle";

import MaintenanceView from "@/views/MaintenanceView.vue";

const { setup } = useLocalization();
const { title } = useRouteTitle();
const route = useRoute();

useTitle(title);
const { isReady, currentNetwork } = useContext();

const isIndex = computed(() => route.name === "home");

setup();
</script>

<style lang="scss">
.container-app {
  @apply container pt-6;
}
</style>
