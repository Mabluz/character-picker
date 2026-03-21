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
const NotFound = () =>
  import(/* webpackChunkName: "not-found" */ "./views/NotFound/NotFound");
const AdminPage = () =>
  import(/* webpackChunkName: "admin" */ "./views/Admin/Admin");
const AdminEmails = () =>
  import(/* webpackChunkName: "admin-emails" */ "./views/Admin/AdminEmails");
const AdminGames = () =>
  import(/* webpackChunkName: "admin-games" */ "./views/Admin/AdminGames");

export default new Router({
  mode: "history",
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { x: 0, y: 0 };
  },
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
      path: "/admin",
      name: "AdminPage",
      component: AdminPage
    },
    {
      path: "/admin/emails",
      name: "AdminEmails",
      component: AdminEmails
    },
    {
      path: "/admin/games",
      name: "AdminGames",
      component: AdminGames
    },
    {
      path: "*",
      name: "NotFound",
      component: NotFound
    }
  ]
});
