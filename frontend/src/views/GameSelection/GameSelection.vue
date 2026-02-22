<template>
  <div class="game-selection">
    <div class="side-ads side-ads--left" v-if="leftColumnAds.length">
      <div class="side-ads__label">Ad</div>
      <a
        v-for="(ad, index) in leftColumnAds"
        :key="'left_ad_' + index"
        :href="ad.link"
        target="_blank"
        rel="noopener nofollow sponsored"
        class="side-ads__item"
        :class="'partner-' + ad.partner"
      >
        <img :src="ad.image" />
        <span v-if="ad.title">{{ ad.title }}</span>
        <span v-if="ad.partner" class="side-ads__item-partner">Ad from {{ ad.partner }}</span>
      </a>
    </div>
    <div class="side-ads side-ads--right" v-if="rightColumnAds.length">
      <div class="side-ads__label">Ad</div>
      <a
        v-for="(ad, index) in rightColumnAds"
        :key="'right_ad_' + index"
        :href="ad.link"
        target="_blank"
        rel="noopener nofollow sponsored"
        class="side-ads__item"
        :class="'partner-' + ad.partner"
      >
        <img :src="ad.image" />
        <span v-if="ad.title">{{ ad.title }}</span>
        <span v-if="ad.partner" class="side-ads__item-partner">Ad from {{ ad.partner }}</span>
      </a>
    </div>
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

    <!-- Mobile affiliate ads under CTA -->
    <div class="mobile-top-ads" v-if="mobileTopAds.length">
      <div class="mobile-top-ads__header">
        <span class="mobile-top-ads__label">Ad</span>
        Sponsored
      </div>
      <div class="mobile-top-ads__items">
        <a
          v-for="(ad, index) in mobileTopAds"
          :key="'mobile_top_ad_' + index"
          :href="ad.link"
          target="_blank"
          rel="noopener nofollow sponsored"
          class="mobile-top-ads__item"
          :class="'partner-' + ad.partner"
        >
          <img :src="ad.image" />
          <span v-if="ad.title" class="mobile-top-ads__item-title">{{ ad.title }}</span>
          <span v-if="ad.partner" class="mobile-top-ads__item-partner">Ad from {{ ad.partner }}</span>
        </a>
      </div>
    </div>

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
      <div
        class="entrance"
        v-for="usergame in filteredUserGames"
        :key="usergame.id"
      >
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
      <div
        class="entrance"
        v-for="gameData in filteredGames"
        :key="gameData.id"
      >
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

    <!-- Bottom affiliate ads -->
    <div class="bottom-ads" v-if="bottomAds.length">
      <div class="bottom-ads__header">
        <span class="bottom-ads__label">Ad</span>
        Sponsored
      </div>
      <div class="bottom-ads__items">
        <a
          v-for="(ad, index) in bottomAds"
          :key="'bottom_ad_' + index"
          :href="ad.link"
          target="_blank"
          rel="noopener nofollow sponsored"
          class="bottom-ads__item"
          :class="'partner-' + ad.partner"
        >
          <img :src="ad.image" />
          <span v-if="ad.title" class="bottom-ads__item-title">{{ ad.title }}</span>
          <span v-if="ad.partner" class="bottom-ads__item-partner">Ad from {{ ad.partner }}</span>
        </a>
      </div>
      <p class="bottom-ads__disclaimer">As an Amazon Associate I earn from qualifying purchases.</p>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import SearchInput from "./SearchInput";
import SpinningDice from "./SpinningDice";
import AdComponent from "../../components/AdComponent";
import sample from "lodash/sample";
import shuffle from "lodash/shuffle";
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
    shuffledAffiliateAds() {
      if (!this.gameOverview) return [];
      const seenTitles = new Set();
      const all = this.gameOverview
        .filter(g => g.affiliate && g.affiliate.ads)
        .flatMap(g => g.affiliate.ads)
        .filter(ad => ad.image && ad.partner === "amazon")
        .filter(ad => {
          if (!ad.title || seenTitles.has(ad.title)) return false;
          seenTitles.add(ad.title);
          return true;
        });
      return shuffle([...all]);
    },
    leftColumnAds() {
      return this.shuffledAffiliateAds.slice(0, 2);
    },
    rightColumnAds() {
      return this.shuffledAffiliateAds.slice(2, 4);
    },
    mobileTopAds() {
      return this.shuffledAffiliateAds.slice(4, 8);
    },
    bottomAds() {
      return this.shuffledAffiliateAds.slice(8, 18);
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
        return sample(colors);
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

.game-selection {
  position: relative;
}

.mobile-top-ads {
  display: none;
  background: #f5f5f5;
  border-top: 3px solid #e0e0e0;
  border-bottom: 3px solid #e0e0e0;
  padding: 20px 16px;
  text-align: center;
  margin-top: 20px;

  @media (max-width: 990px) {
    display: block;
  }

  &__header {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #444;
    margin-bottom: 14px;
  }

  &__label {
    display: inline-block;
    background: #444;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 3px;
    margin-right: 6px;
    vertical-align: middle;
  }

  &__items {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 14px;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
    width: calc(50% - 7px);
    box-sizing: border-box;
    text-decoration: none;
    color: #222;
    transition: box-shadow 0.2s;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    }

    &.partner-amazon {
      border-color: #ff9900;

      .mobile-top-ads__item-partner {
        color: #ff9900;
      }
    }

    img {
      width: 90px;
      height: 90px;
      object-fit: contain;
      margin-bottom: 8px;
    }
  }

  &__item-title {
    font-size: 12px;
    text-align: center;
    line-height: 1.3;
    margin-bottom: 4px;
  }

  &__item-partner {
    font-size: 10px;
    font-weight: bold;
    text-transform: capitalize;
    margin-top: auto;
    padding-top: 6px;
  }
}

.bottom-ads {
  background: #f5f5f5;
  border-top: 3px solid #e0e0e0;
  border-bottom: 3px solid #e0e0e0;
  padding: 30px 20px;
  text-align: center;

  &__header {
    font-size: 15px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #444;
    margin-bottom: 20px;
  }

  &__label {
    display: inline-block;
    background: #444;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 3px;
    margin-right: 8px;
    vertical-align: middle;
  }

  &__items {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 20px;
    max-width: 880px; // 5 × 160px + 4 × 20px gaps
    margin: 0 auto;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 14px;
    width: 160px;
    box-sizing: border-box;
    text-decoration: none;
    color: #222;
    transition: box-shadow 0.2s, transform 0.2s;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

    &.partner-amazon {
      border-color: #ff9900;

      .bottom-ads__item-partner {
        color: #ff9900;
      }
    }

    img {
      width: 120px;
      height: 120px;
      object-fit: contain;
      margin-bottom: 10px;
    }
  }

  &__item-title {
    font-size: 13px;
    text-align: center;
    line-height: 1.3;
    margin-bottom: 6px;
  }

  &__item-partner {
    font-size: 11px;
    font-weight: bold;
    text-transform: capitalize;
    margin-top: auto;
    padding-top: 8px;
  }

  &__disclaimer {
    font-size: 12px;
    font-style: italic;
    color: #666;
    margin-top: 20px;
    border-top: 1px solid #ddd;
    padding-top: 12px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }
}

.side-ads {
  position: absolute;
  top: 80px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;

  &--left { left: 10px; }
  &--right { right: 10px; }

  @media (max-width: 1400px) {
    display: none;
  }

  &__label {
    display: inline-block;
    background: #444;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 3px;
    letter-spacing: 0.5px;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 14px;
    width: 160px;
    text-decoration: none;
    color: #222;
    font-size: 13px;
    text-align: center;
    line-height: 1.3;
    transition: box-shadow 0.2s, transform 0.2s;

    &:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

    &.partner-amazon {
      border-color: #ff9900;

      .side-ads__item-partner {
        color: #ff9900;
      }
    }

    img {
      width: 120px;
      height: 120px;
      object-fit: contain;
      margin-bottom: 8px;
    }
  }

  &__item-partner {
    font-size: 11px;
    font-weight: bold;
    margin-top: 6px;
    text-transform: capitalize;
  }
}
</style>
