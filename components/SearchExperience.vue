<template>
  <div>
    <AisInstantSearch :widgets :configuration>
      <AisInfiniteHits />
      <AisRefinementList attribute="brand" searchable />
    </AisInstantSearch>
  </div>
</template>

<script setup lang="ts">
import algoliasearch, { type AlgoliaSearchOptions } from "algoliasearch";


const config: AlgoliaSearchOptions = import.meta.client ? {
  hosts: [{
    url: `${location.host}/alg-prx`,
    protocol: 'https'
  }]
} : {}
const client = algoliasearch("latency", "6be0576ff61c053d5f9a3225e2a90f76", config);

const widgets = computed(() => [
  useAisInfiniteHits({
    showPrevious: true,
  }),
  useAisRefinementList({
    attribute: "brand",
    showMore: true,
  }),
]);

const configuration = ref({
  indexName: "instant_search",
  searchClient: client,
});
</script>
