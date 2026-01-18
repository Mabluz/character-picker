import Vue from "vue";
import Vuex from "vuex";

import game from "./modules/game";
import user from "./modules/user";
import page from "./modules/page";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    game,
    user,
    page
  }
});
