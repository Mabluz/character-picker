import axios from "axios";
import config from "../../../config/config";
import cookie from "vue-cookies";

let userCookieName = "charPickerLogin";

const blankState = () => {
  return {
    user: undefined
  };
};

export default {
  namespaced: true,
  state: blankState(),
  mutations: {
    setUser(state, user) {
      state.user = user;
    }
  },
  getters: {
    userLoggedIn: state => {
      if (state.user && state.user.email && state.user.token) {
        return true;
      }
      return false;
    },
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
      commit("setUser", blankState());
      commit("game/setUserGames", undefined, { root: true });
    },
    setCookieLogin(context, userData) {
      cookie.set(
        userCookieName,
        userData.email + "|||" + userData.token,
        "14d"
      );
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
                commit("setUser", data);
              } else {
                cookie.set(userCookieName, "", 0);
                commit("setUser", blankState());
                commit("game/setUserGames", undefined, { root: true });
              }
            });
        }
      }
    }
  }
};
