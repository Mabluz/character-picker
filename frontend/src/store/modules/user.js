import axios from "axios";
import config from "../../../config/config";
import cookie from "vue-cookies";

let userCookieName = "charPickerLogin";

const blankState = () => {
  return {
    user: undefined,
    isAdmin: false
  };
};

export default {
  namespaced: true,
  state: blankState(),
  mutations: {
    setUser(state, user) {
      state.user = user;
    },
    setIsAdmin(state, isAdmin) {
      state.isAdmin = isAdmin || false;
    }
  },
  getters: {
    userLoggedIn: state => {
      if (state.user && state.user.email && state.user.token) {
        return true;
      }
      return false;
    },
    isAdmin: state => state.isAdmin,
    getUserNameByEmail: state => {
      if (state.user && state.user.email) {
        let email = state.user.email.split("@");
        email = email[0];
        return email[0].toUpperCase() + email.slice(1);
      }
      return undefined;
    }
  },
  actions: {
    async loginUser({ commit, dispatch }, userData) {
      let data = await new Promise(resolve => {
        axios({
          method: "post",
          url: config.backendServer + "/user/login",
          data: userData
        })
          .catch(function(error) {
            if (
              error &&
              error.response &&
              error.response.data &&
              error.response.data.error
            ) {
              return resolve(error.response.data);
            }
          })
          .then(data => {
            if (data && data.data && data.data.answer) {
              dispatch("setCookieLogin", data.data.answer);
              commit("setUser", data.data.answer);
              commit("setIsAdmin", data.data.answer.isAdmin);
              return resolve(true);
            } else {
              return resolve({
                error: "Something went wrong during log in. Try again!"
              });
            }
          });
      });
      return data;
    },
    async signupUser({ dispatch, commit }, userData) {
      let data = await new Promise(resolve => {
        axios({
          method: "post",
          url: config.backendServer + "/user/signup",
          data: userData
        })
          .catch(function(error) {
            if (
              error &&
              error.response &&
              error.response.data &&
              error.response.data.error
            ) {
              resolve(error.response.data);
            }
          })
          .then(data => {
            if (data && data.data && data.data.answer) {
              dispatch("setCookieLogin", data.data.answer);
              commit("setUser", data.data.answer);
              commit("setIsAdmin", data.data.answer.isAdmin);
              return resolve(true);
            } else {
              return resolve({
                error: "Something went wrong during signup. Try again!"
              });
            }
          });
      });
      return data;
    },
    async resetPassword(context, userData) {
      let data = await new Promise(resolve => {
        axios({
          method: "post",
          url: config.backendServer + "/user/resetpassword",
          data: userData
        })
          .catch(function(error) {
            if (
              error &&
              error.response &&
              error.response.data &&
              error.response.data.error
            ) {
              resolve(error.response.data);
            }
          })
          .then(data => {
            if (data && data.data && data.data.answer) {
              return resolve(data.data);
            } else {
              return resolve({
                error: "Something went wrong during password reset. Try again!"
              });
            }
          });
      });
      return data;
    },
    async acceptPasswordReset(context, userData) {
      let data = await new Promise(resolve => {
        axios({
          method: "post",
          url: config.backendServer + "/user/validatepasswordreset",
          data: userData
        })
          .catch(function(error) {
            if (
              error &&
              error.response &&
              error.response.data &&
              error.response.data.error
            ) {
              resolve(error.response.data);
            }
          })
          .then(data => {
            if (data && data.data && data.data.answer) {
              return resolve(data.data);
            } else {
              return resolve({
                error: "Something went wrong during password reset. Try again!"
              });
            }
          });
      });
      return data;
    },
    logout({ commit }) {
      cookie.set(userCookieName, "", 0);
      commit("setUser", undefined);
      commit("setIsAdmin", false);
      commit("game/setUserGames", undefined, { root: true });
    },
    setCookieLogin(context, userData) {
      cookie.set(
        userCookieName,
        userData.email + "|||" + userData.token,
        "14d"
      );
    },
    async adminGetUsers({ state }) {
      const { email, token } = state.user || {};
      const response = await axios({
        method: "get",
        url: config.backendServer + "/adminview/api/users",
        params: { email, token }
      });
      return response.data;
    },
    async adminSetAdmin({ state }, { userId, isAdmin }) {
      const { email, token } = state.user || {};
      const response = await axios({
        method: "patch",
        url: config.backendServer + "/adminview/api/users/" + userId + "/admin",
        data: { email, token, isAdmin }
      });
      return response.data;
    },
    async adminSetBlocked({ state }, { userId, isBlocked }) {
      const { email, token } = state.user || {};
      const response = await axios({
        method: "patch",
        url: config.backendServer + "/adminview/api/users/" + userId + "/blocked",
        data: { email, token, isBlocked }
      });
      return response.data;
    },
    async adminGetBackup({ state }) {
      const { email, token } = state.user || {};
      const response = await axios({
        method: "get",
        url: config.backendServer + "/adminview/api/backup",
        params: { email, token }
      });
      return response.data;
    },
    async adminGetUserGames({ state }) {
      const { email, token } = state.user || {};
      const response = await axios({
        method: "get",
        url: config.backendServer + "/adminview/api/games/user",
        params: { email, token }
      });
      return response.data;
    },
    async adminGetMainGames({ state }) {
      const { email, token } = state.user || {};
      const response = await axios({
        method: "get",
        url: config.backendServer + "/adminview/api/games/main",
        params: { email, token }
      });
      return response.data;
    },
    async adminGetEmails({ state }, { limit, after } = {}) {
      const { email, token } = state.user || {};
      const params = { email, token, limit: limit || 50 };
      if (after) params.after = after;
      const response = await axios({
        method: "get",
        url: config.backendServer + "/adminview/api/emails",
        params
      });
      return response.data;
    },
    async adminGetEmailErrors({ state }) {
      const { email, token } = state.user || {};
      const response = await axios({
        method: "get",
        url: config.backendServer + "/adminview/api/email-errors",
        params: { email, token }
      });
      return response.data;
    },
    async adminGetEmailAlertCount({ state }) {
      const { email, token } = state.user || {};
      const response = await axios({
        method: "get",
        url: config.backendServer + "/adminview/api/email-errors/count",
        params: { email, token }
      });
      return response.data;
    },
    async adminClearEmailAlerts({ state }) {
      const { email, token } = state.user || {};
      const response = await axios({
        method: "post",
        url: config.backendServer + "/adminview/api/email-errors/clear",
        data: { email, token }
      });
      return response.data;
    },
    async getLoginSession({ commit }) {
      let data = cookie.get(userCookieName);
      if (data) {
        data = data.split("|||");
        if (data.length > 1) {
          data = {
            email: data[0],
            token: data[1]
          };
          axios({
            method: "post",
            url: config.backendServer + "/user/validate",
            data: data
          })
            .catch(function() {
              cookie.set(userCookieName, "", 0);
              commit("setUser", blankState());
              commit("game/setUserGames", undefined, { root: true });
            })
            .then(answer => {
              if (answer && answer.data && answer.data.login) {
                commit("game/setUserGames", answer.data.data, { root: true });
                commit("setUser", { email: data.email, token: data.token });
                commit("setIsAdmin", answer.data.isAdmin);
              } else {
                cookie.set(userCookieName, "", 0);
                commit("setUser", undefined);
                commit("setIsAdmin", false);
                commit("game/setUserGames", undefined, { root: true });
              }
            });
        }
      }
    }
  }
};
