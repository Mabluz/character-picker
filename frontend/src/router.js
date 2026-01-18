import Vue from "vue";
import Router from "vue-router";
import CharacterPicker from "./views/CharacterPicker/CharacterPicker";
import GameSelection from "./views/GameSelection/GameSelection";
import NewGame from "./views/CreateGame/NewGame";
import PasswordReset from "./views/Password/PasswordReset";
import DonatePage from "./views/Donate/Donate";
import DonateThanks from "./views/Donate/DonateThanks";
import DonateCancel from "./views/Donate/DonateCancel";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "GameSelection",
      component: GameSelection
    },
    {
      path: "/game/:game",
      name: "CharacterPicker",
      component: CharacterPicker
    },
    {
      path: "/create/newgame",
      name: "NewGame",
      component: NewGame
    },
    {
      path: "/create/editgame/:id",
      name: "EditGame",
      component: NewGame
    },
    {
      path: "/password-reset/",
      name: "PasswordReset",
      component: PasswordReset
    },
    {
      path: "/donate",
      name: "DonatePage",
      component: DonatePage
    },
    {
      path: "/donate/thanks",
      name: "DonateThanks",
      component: DonateThanks
    },
    {
      path: "/donate/cancel",
      name: "DonateCancel",
      component: DonateCancel
    }
  ]
});
