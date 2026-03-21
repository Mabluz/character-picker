import axios from "axios";
import config from "../../../config/config";
import cookie from "vue-cookies";

let userCookieName = "charPickerLogin";

let localTokenKey = "charPickerLocalToken";

const blankState = () => {
  return {
    user: undefined,
    isAdmin: false,
    isLocalUser: false
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
    },
    setIsLocalUser(state, isLocalUser) {
      state.isLocalUser = isLocalUser || false;
    }
  },
  getters: {
    userLoggedIn: state => {
      if (state.user && state.user.token) {
        if (state.user.email) return true;
        if (state.isLocalUser) return true;
      }
      return false;
    },
    isAdmin: state => state.isAdmin,
    isLocalUser: state => state.isLocalUser,
    getUserNameByEmail: state => {
      if (state.isLocalUser) return "Unknown User";
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
    async googleLogin({ commit, dispatch }, credential) {
      let data = await new Promise(resolve => {
        axios({
          method: "post",
          url: config.backendServer + "/user/google-login",
          data: { credential }
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
            return resolve({ error: "Google login failed. Try again!" });
          })
          .then(data => {
            if (data && data.data && data.data.answer) {
              dispatch("setCookieLogin", data.data.answer);
              commit("setUser", data.data.answer);
              commit("setIsAdmin", data.data.answer.isAdmin);
              return resolve(true);
            } else {
              return resolve({
                error: "Something went wrong during Google login. Try again!"
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
    async logout({ commit, state }) {
      if (state.isLocalUser && state.user && state.user.token) {
        // Delete the local account from the backend
        try {
          await axios({
            method: "delete",
            url: config.backendServer + "/user/local-account",
            data: { token: state.user.token }
          });
        } catch (e) {
          // Proceed with logout regardless
        }
        localStorage.removeItem(localTokenKey);
      }
      cookie.set(userCookieName, "", 0);
      commit("setUser", undefined);
      commit("setIsAdmin", false);
      commit("setIsLocalUser", false);
      commit("game/setUserGames", undefined, { root: true });
    },
    setCookieLogin(context, userData) {
      cookie.set(
        userCookieName,
        (userData.email || "") + "|||" + userData.token,
        "14d"
      );
    },
    async localLogin({ commit, dispatch }) {
      let localToken = localStorage.getItem(localTokenKey);
      if (!localToken) {
        localToken = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
        });
        localStorage.setItem(localTokenKey, localToken);
      }
      let data = await new Promise(resolve => {
        axios({
          method: "post",
          url: config.backendServer + "/user/local-login",
          data: { localToken }
        })
          .catch(function(error) {
            if (error && error.response && error.response.data && error.response.data.error) {
              return resolve(error.response.data);
            }
            return resolve({ error: "Local login failed. Try again!" });
          })
          .then(data => {
            if (data && data.data && data.data.answer) {
              dispatch("setCookieLogin", data.data.answer);
              commit("setUser", data.data.answer);
              commit("setIsAdmin", data.data.answer.isAdmin);
              commit("setIsLocalUser", true);
              commit("game/setUserGames", data.data.answer.data || [], { root: true });
              return resolve(true);
            } else {
              return resolve({ error: "Something went wrong during local login. Try again!" });
            }
          });
      });
      return data;
    },
    async linkToGoogle({ commit, dispatch }, credential) {
      const localToken = localStorage.getItem(localTokenKey);
      if (!localToken) return { error: "No local token found" };
      let data = await new Promise(resolve => {
        axios({
          method: "post",
          url: config.backendServer + "/user/link-google",
          data: { localToken, credential }
        })
          .catch(function(error) {
            if (error && error.response && error.response.data && error.response.data.error) {
              return resolve(error.response.data);
            }
            return resolve({ error: "Failed to link Google account. Try again!" });
          })
          .then(data => {
            if (data && data.data && data.data.answer) {
              localStorage.removeItem(localTokenKey);
              dispatch("setCookieLogin", data.data.answer);
              commit("setUser", data.data.answer);
              commit("setIsAdmin", data.data.answer.isAdmin);
              commit("setIsLocalUser", false);
              return resolve(true);
            } else {
              return resolve({ error: "Something went wrong. Try again!" });
            }
          });
      });
      return data;
    },
    async linkToEmail({ commit, dispatch }, { email, password, repeat }) {
      const localToken = localStorage.getItem(localTokenKey);
      if (!localToken) return { error: "No local token found" };
      let data = await new Promise(resolve => {
        axios({
          method: "post",
          url: config.backendServer + "/user/link-email",
          data: { localToken, email, password, repeat }
        })
          .catch(function(error) {
            if (error && error.response && error.response.data && error.response.data.error) {
              return resolve(error.response.data);
            }
            return resolve({ error: "Failed to create account. Try again!" });
          })
          .then(data => {
            if (data && data.data && data.data.answer) {
              localStorage.removeItem(localTokenKey);
              dispatch("setCookieLogin", data.data.answer);
              commit("setUser", data.data.answer);
              commit("setIsAdmin", data.data.answer.isAdmin);
              commit("setIsLocalUser", false);
              return resolve(true);
            } else {
              return resolve({ error: "Something went wrong. Try again!" });
            }
          });
      });
      return data;
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
        url:
          config.backendServer + "/adminview/api/users/" + userId + "/blocked",
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
    async getLoginSession({ commit, dispatch }) {
      let data = cookie.get(userCookieName);
      if (data) {
        data = data.split("|||");
        if (data.length > 1) {
          const email = data[0] || "";
          const token = data[1];
          const isLocal = !email;

          axios({
            method: "post",
            url: config.backendServer + "/user/validate",
            data: { email: email || undefined, token }
          })
            .catch(function() {
              cookie.set(userCookieName, "", 0);
              commit("setUser", undefined);
              commit("setIsAdmin", false);
              commit("setIsLocalUser", false);
              commit("game/setUserGames", undefined, { root: true });
            })
            .then(async answer => {
              if (answer && answer.data && answer.data.login) {
                commit("game/setUserGames", answer.data.data, { root: true });
                commit("setUser", { email: email || null, token });
                commit("setIsAdmin", answer.data.isAdmin);
                commit("setIsLocalUser", isLocal);
              } else {
                cookie.set(userCookieName, "", 0);
                // Fallback: try localStorage token for local users
                const storedLocalToken = localStorage.getItem(localTokenKey);
                if (storedLocalToken) {
                  commit("game/setUserGames", undefined, { root: true });
                  await dispatch("localLogin");
                } else {
                  commit("setUser", undefined);
                  commit("setIsAdmin", false);
                  commit("setIsLocalUser", false);
                  commit("game/setUserGames", undefined, { root: true });
                }
              }
            });
        }
      }
    }
  }
};
