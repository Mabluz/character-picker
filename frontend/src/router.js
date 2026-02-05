import Vue from "vue";
import Router from "vue-router";
Vue.use(Router);

const CharacterPicker = () =>
  import(
    /* webpackChunkName: "character-picker" */ "./views/CharacterPicker/CharacterPicker"
  );
const GameSelection = () =>
  import(
    /* webpackChunkName: "game-selection" */ "./views/GameSelection/GameSelection"
  );
const NewGame = () =>
  import(/* webpackChunkName: "new-game" */ "./views/CreateGame/NewGame");
const PasswordReset = () =>
  import(
    /* webpackChunkName: "password-reset" */ "./views/Password/PasswordReset"
  );
const DonatePage = () =>
  import(/* webpackChunkName: "donate" */ "./views/Donate/Donate");
const DonateThanks = () =>
  import(/* webpackChunkName: "donate-thanks" */ "./views/Donate/DonateThanks");
const DonateCancel = () =>
  import(/* webpackChunkName: "donate-cancel" */ "./views/Donate/DonateCancel");

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
