<template>
  <div class="ad-container">
    <ins
      class="adsbygoogle"
      :style="adStyle"
      :data-ad-client="adClient"
      :data-ad-slot="adSlot"
      :data-ad-format="adFormat"
      :data-full-width-responsive="fullWidthResponsive"
    ></ins>
  </div>
</template>

<script>
export default {
  name: "AdComponent",
  props: {
    adClient: {
      type: String,
      default: "ca-pub-6501658256632489"
    },
    adSlot: {
      type: String,
      required: true
    },
    adFormat: {
      type: String,
      default: "auto"
    },
    fullWidthResponsive: {
      type: String,
      default: "true"
    },
    adStyle: {
      type: Object,
      default: () => ({ display: "block" })
    }
  },
  mounted() {
    this.loadAd();
  },
  methods: {
    loadAd() {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {
        console.error("AdSense error:", e);
      }
    }
  }
};
</script>

<style scoped>
.ad-container {
  margin: 20px 0;
  overflow: hidden;
  text-align: center;
}
</style>
