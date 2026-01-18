import Vue from "vue";
import VueAnalytics from "vue-analytics";
import App from "./App.vue";
import router from "./router";
import config from "../config/config";
import store from "./store/store";
import VueHead from "vue-head";
import VueCookies from "vue-cookies";

if (!config.debug) {
  Vue.use(VueAnalytics, {
    id: "UA-151099222-1",
    router
  });
}

Vue.use(VueHead);
Vue.use(VueCookies);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
