import axios from "axios";
import config from "../../../config/config";
import _ from "lodash";
import uuid from "uuid";

const splitUpGameData = game => {
  if (game && game.characters && game.characters.length > 0) {
    if (game.characters[0].constructor === String) {
      game.tabs = [setupGameData(game.characters)];
      // Delete legacy characters array to prevent re-parsing on subsequent setGame calls
      delete game.characters;
    }
  } else if (game && game.tabs) {
    game.tabs = game.tabs.map(tab => {
      if (tab.characters[0].constructor === String) {
        let content = setupGameData(tab.characters);
        content.title = tab.title;
        return content;
      } else {
        return tab;
      }
    });
  }
  return game;

  function setupGameData(characters) {
    let container = {};
    container.characters = characters.map((char, index) => {
      let charArray =
        char.constructor === String ? char.split("|") : _.values(char);
      if (charArray[0] === "") {
        charArray.shift();
        charArray.unshift(true);
      } else {
        charArray.unshift(false);
      }
      return {
        index: index,
        remove: charArray[0],
        skipp: charArray[0],
        name: charArray[1],
        container: charArray[2],
        type: charArray[3],
        image:
          charArray[4] && !charArray[4].startsWith("http")
            ? config.backendServer + "/" + charArray[4]
            : charArray[4],
        hovered: false,
        clicked: false,
        selected: false,
        picked: false
      };
    });

    container.categories = {};
    container.categories.types = _.map(
      _.uniq(
        _.flatten(
          _.map(container.characters, function(value) {
            return value && value.type ? value.type.split("/") : [];
          })
        )
      ),
      function(value) {
        return { value: value, count: countAllTypes(value) };
      }
    );
    container.categories.containers = _.map(
      _.uniq(
        _.map(container.characters, function(value) {
          return value.container;
        })
      ),
      function(value) {
        return { value: value, count: countAllTypes(value) };
      }
    );
    container.categories.all = _.union(
      container.categories.types,
      container.categories.containers
    );
    container.categories.all = container.categories.all.map(item => {
      item.checked = false;
      return item;
    });
    return container;

    function countAllTypes(value) {
      let count = 0;
      value = value ? value.split("/") : undefined;
      for (let i = 0; i < container.characters.length; i++) {
        let object = container.characters[i];
        let objectType = object && object.type ? object.type.split("/") : [];
        let objectContainer =
          object && object.container ? object.container.split("/") : [];
        if (
          _.intersection(value, objectType).length > 0 ||
          _.intersection(value, objectContainer).length > 0
        ) {
          count++;
        }
      }
      return count;
    }
  }
};

const blankState = () => {
  return {
    gameOverview: undefined,
    game: undefined,
    isUserGame: false,
    userGames: undefined
  };
};

export default {
  namespaced: true,
  state: blankState(),
  mutations: {
    setGameOverview(state, overview) {
      state.gameOverview = overview;
    },
    clearGame(state) {
      state.game = undefined;
      state.isUserGame = false;
    },
    setGame(state, game) {
      game = splitUpGameData(game);
      let cloneBaby = _.clone(game);
      cloneBaby.tabs = cloneBaby.tabs.map(set => {
        set.characters = set.characters.map(char => {
          char.uuid = [uuid(), uuid(), uuid(), uuid(), uuid()];
          char.picked = false;
          char.selected = false;
          char.clicked = false;
          char.hovered = false;
          if (!char.skipp) char.remove = false;
          return char;
        });
        //set.categories =  { all: [] };
        return set;
      });
      if (!cloneBaby.settings) cloneBaby.settings = {};
      state.game = cloneBaby;
    },
    setUserGames(state, games) {
      state.userGames = games;
    }
  },
  getters: {
    getGame(state) {
      return state.game;
    },
    getUserGames() {}
  },
  actions: {
    async deleteUserGame({ state, rootState, commit, dispatch }, gameId) {
      let userData = {
        email: rootState.user.user.email,
        token: rootState.user.user.token
      };

      let loading = true;
      setTimeout(() => {
        commit("page/setLoadingSpinner", loading, { root: true });
      }, 500);

      let data = await new Promise((resolve, reject) => {
        axios({
          method: "delete",
          url: config.backendServer + "/usergame/" + gameId,
          data: userData
        })
          .catch(function(error, test) {
            console.log("error: ", error);
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
            if (data.data.deleted) {
              dispatch("user/getLoginSession", undefined, { root: true });
              return resolve(data.data);
            } else return resolve(data.data);
          });
      });

      loading = false;
      commit("page/setLoadingSpinner", loading, { root: true });

      console.log("Delete", data);
      return data;
    },
    async saveUserGame({ state, rootState, commit, dispatch }, userData) {
      userData.email = rootState.user.user.email;
      userData.token = rootState.user.user.token;

      let loading = true;
      setTimeout(() => {
        commit("page/setLoadingSpinner", loading, { root: true });
      }, 500);

      let data = await new Promise((resolve, reject) => {
        axios({
          method: "post",
          url: config.backendServer + "/usergame/" + userData.background.title,
          data: buildBackendDataOfGames(userData)
        })
          .catch(function(error, test) {
            console.log("error: ", error);
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
            if (data && data.data && data.data.data) {
              commit("setUserGames", data.data.data);
              if (state.game && state.game.id) {
                state.userGames.forEach(game => {
                  if (state.game.id === game.id) {
                    commit("clearGame");
                    commit("setGame", game);
                  }
                });
              } else if (data.data.currentId) {
                state.userGames.forEach(game => {
                  if (data.data.currentId === game.id) {
                    commit("clearGame");
                    commit("setGame", game);
                  }
                });
              }
              return resolve(data.data.currentId);
            } else {
              return resolve({
                error: "Something went wrong during log in. Try again!"
              });
            }
          });
      });

      loading = false;
      commit("page/setLoadingSpinner", loading, { root: true });

      return data;

      function buildBackendDataOfGames(userData) {
        let charsObjectToString = chars => {
          let valueOrEmtpy = value => {
            return value ? value : "";
          };

          return chars.map(char => {
            let returnString = "";
            if (char.remove) returnString += "|";
            returnString += valueOrEmtpy(char.name) + "|";
            returnString += valueOrEmtpy(char.container) + "|";
            returnString += valueOrEmtpy(char.type) + "|";
            returnString += valueOrEmtpy(char.image);
            return returnString;
          });
        };

        if (userData && userData.tabs) {
          userData.tabs = userData.tabs.map(tab => {
            tab.characters = charsObjectToString(tab.characters);
            delete tab.categories;
            return tab;
          });
          // Delete legacy characters array to avoid conflicts when loading
          delete userData.characters;
        } else if (userData.characters) {
          userData.tabs = [
            { characters: charsObjectToString(userData.characters) }
          ];
          delete userData.categories;
          delete userData.characters;
        }
        return userData;
      }
    },
    async downloadMainGameData({ state, rootState, commit, dispatch }, gameId) {
      let gameData; // Main game
      let loading = true;
      setTimeout(() => {
        commit("page/setLoadingSpinner", loading, { root: true });
      }, 500);

      gameData = await axios.get(config.backendServer + "/game/" + gameId);

      loading = false;
      commit("page/setLoadingSpinner", loading, { root: true });

      gameData = gameData && gameData.data ? gameData.data : undefined;
      return splitUpGameData(gameData);
    },
    async downloadGame({ state, rootState, commit, dispatch }, gameId) {
      let gameData;
      if (state.userGames) {
        // User game
        gameData = state.userGames.filter(game => {
          return game.id === decodeURIComponent(gameId);
        });
        gameData = gameData && gameData.length > 0 ? gameData[0] : undefined;
        state.isUserGame = gameData ? true : false;
      }

      if (!gameData) {
        // Main game
        if (!state.gameOverview) await dispatch("downloadOverview");

        let loading = true;
        setTimeout(() => {
          commit("page/setLoadingSpinner", loading, { root: true });
        }, 500);

        gameData = await axios.get(config.backendServer + "/game/" + gameId);

        loading = false;
        commit("page/setLoadingSpinner", loading, { root: true });

        gameData = gameData && gameData.data ? gameData.data : undefined;
      }
      console.log("Using game data", gameData);
      if (gameData) {
        commit("setGame", gameData);
        return true;
      }
    },
    async downloadOverview({ state, rootState, commit }) {
      let loading = true;
      setTimeout(() => {
        commit("page/setLoadingSpinner", loading, { root: true });
      }, 500);

      let gameOverview = await axios.get(config.backendServer + "/game/");
      if (gameOverview && gameOverview.data)
        commit("setGameOverview", gameOverview.data);

      loading = false;
      commit("page/setLoadingSpinner", loading, { root: true });
    }
  }
};
