<template>
  <div class="game-selection">
    <h1>
      <span class="border"></span>Random Boardgame<spinning-dice
        class="dice-container"
      ></spinning-dice>
    </h1>

    <div class="intro" v-if="!userLoggedIn">
      <p>Lets play a boardgame!</p>
      <p>What heroes should we use? What monsters should we kill?</p>
      <p><b>I know, lets use this web page to figure it out!</b></p>
    </div>
    <login
      >Can't find a randomizer for a specific game? Create it yourself!<br />See
      your games by logging in!</login
    >

    <search-input @search="filterSearch" class="search"></search-input>
    <div class="container user-games" v-if="userLoggedIn">
      <div class="heading">Your games</div>
      <div class="entrance">
        <router-link :to="'/create/newgame'">
          <div class="background" style="background-color: #42b983">
            <img class="icon" src="../../../public/newgame.png" />
          </div>
          <h2 style="color: black">Create new game</h2>
        </router-link>
      </div>
      <div class="entrance" v-for="usergame in filteredUserGames">
        <router-link :to="'/game/' + usergame.id">
          <div
            class="background"
            :style="{
              backgroundImage: 'url(' + usergame.backgroundUrl + ')',
              backgroundSize: 'cover',
              backgroundColor: randomBackgroundColor(usergame)
            }"
          ></div>
          <h2 style="color: black">{{ usergame.background.title }}</h2>
          <!--:style="{color: game.titleColor}"-->
        </router-link>
      </div>

      <ad-component ad-slot="YOUR_GAMES_AD_SLOT"></ad-component>

      <div class="heading">Pre-set games</div>
    </div>
    <div class="container">
      <div class="entrance" v-for="gameData in filteredGames">
        <router-link :to="'/game/' + gameData.id">
          <div
            class="background"
            :style="{
              backgroundImage: 'url(' + gameData.backgroundUrl + ')',
              backgroundSize: 'cover'
            }"
          ></div>
          <h2 style="color: black">{{ gameData.title }}</h2>
          <!--:style="{color: game.titleColor}"-->
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import SearchInput from "./SearchInput";
import SpinningDice from "./SpinningDice";
import AdComponent from "../../components/AdComponent";
import _ from "lodash";
import config from "../../../config/config";
import Login from "../Login/Login";

export default {
  name: "GameSelection",
  components: { Login, SpinningDice, SearchInput, AdComponent },
  data: function() {
    return {
      searchValue: ""
    };
  },
  head: function() {
    let head = {};
    head.title = {
      inner: "Randomize your drafting - randomboardgame"
    };
    head.meta = [];
    head.meta.push({
      property: "og:title",
      content: "Randomize your drafting - randomboardgame"
    });
    head.meta.push({
      property: "og:image",
      content: config.vueServer + "/randomboardgame.jpg"
    });
    return head;
  },
  computed: {
    ...mapState("game", ["gameOverview", "userGames"]),
    ...mapGetters("user", ["userLoggedIn"]),
    filteredUserGames() {
      if (!this.userGames) return [];
      let userGames = this.userGames;
      userGames = userGames.sort((a, b) => {
        if (a.background.title.toLowerCase() > b.background.title.toLowerCase())
          return 1;
        if (a.background.title.toLowerCase() < b.background.title.toLowerCase())
          return -1;
        return 0;
      });
      userGames = userGames.map(game => {
        game.backgroundUrl =
          game.background && game.background.thumbnail
            ? game.background.thumbnail
            : game.background && game.background.url
            ? game.background.url
            : undefined;
        if (game.backgroundUrl && !game.backgroundUrl.startsWith("http"))
          game.backgroundUrl = config.backendServer + "/" + game.backgroundUrl;
        return game;
      });
      if (!this.searchValue || this.searchValue === "") return userGames;

      return userGames.filter(game => {
        return game.background.title
          .toLowerCase()
          .startsWith(this.searchValue.toLowerCase());
      });
    },
    filteredGames() {
      if (!this.gameOverview) return [];
      let mainGames = this.gameOverview;
      if (this.userGames) {
        let games = this.userGames.map(game => {
          let gameSplit = game.id.split("---");
          return gameSplit.length > 1 ? gameSplit[1] : game;
        });
        mainGames = mainGames.filter(game => {
          let keep = true;
          for (let usergame of games) {
            if (game.id === usergame) {
              keep = false;
              break;
            }
          }
          return keep;
        });
      }
      if (!this.searchValue || this.searchValue === "") return mainGames;
      return mainGames.filter(game => {
        return game.title
          .toLowerCase()
          .startsWith(this.searchValue.toLowerCase());
      });
    }
  },
  methods: {
    filterSearch(searchValue) {
      this.searchValue = searchValue;
    },
    randomBackgroundColor(usergame) {
      if (usergame && usergame.backgroundUrl) return "transparent";
      else
        return (
          "#" +
          getRandomColor() +
          getRandomColor() +
          getRandomColor() +
          getRandomColor() +
          getRandomColor() +
          getRandomColor()
        );

      function getRandomColor() {
        let colors = [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "A",
          "B",
          "C",
          "D",
          "E",
          "F"
        ];
        return _.sample(colors);
      }
    }
  },
  created: async function() {
    this.$store.dispatch("game/downloadOverview");
  }
};
</script>

<style scoped lang="less">
.game-selection {
  .search {
    margin: 100px 0 30px 0;
  }
  .intro {
    margin-bottom: 50px;
    p {
      margin: 5px;
    }
  }
  .container {
    width: 100%;
    font-size: 0;
    background: white;
    .heading {
      width: 100%;
      color: white;
      background: #f76331;
      font-size: 30px;
      padding: 10px 0;
      border-top: 4px solid black;
      border-bottom: 4px solid black;
    }

    .entrance {
      width: 33.33333333333333333%;
      height: 300px;
      display: inline-block;
      font-size: 0;
      .icon {
        margin-top: 2.5%;
        max-width: 90%;
        max-height: 90%;
      }
      a {
        height: 300px;
        width: 100%;
        display: block;
        position: relative;
        .background {
          height: 300px;
          width: 100%;
          display: block;
          position: absolute;
          opacity: 0.5;
          transition: 0.5s opacity;
        }
        h2 {
          position: absolute;
          font-size: 24px;
          width: 70%;
          margin-left: 12.5%;
          margin-top: 140px;
          padding: 2.5%;
          transition: 0.5s font-size, 0.5s background, 0.5s margin-left,
            0.5s padding, 0.5s margin-top, 0.5s border, 0.5s width,
            0.5s border-radius;
          background-color: rgba(255, 255, 255, 0.7);
          border-radius: 2px;
          border: 1px solid black;
        }
        &:hover {
          .background {
            opacity: 1;
          }
          h2 {
            font-size: 30px;
            background: white;
            width: 80%;
            margin-top: 130px;
            margin-left: 7.5%;
            border-radius: 8px;
            border: 3px solid black;
          }
        }
      }
    }
  }
  @media (max-width: 990px) {
    h1 {
      .border {
        display: none;
      }
      .dice-container {
        display: none;
        /*
                    display: block;
                    height: 40px;
                    right: auto;
                    left: 50%;
                    margin-left: -16px;
                    top: 83px;
                     */
      }
    }
    .container {
      .entrance {
        width: 50%;
      }
    }
  }
  @media (max-width: 680px) {
    .container {
      .entrance {
        width: 100%;
      }
    }
  }
}
</style>
