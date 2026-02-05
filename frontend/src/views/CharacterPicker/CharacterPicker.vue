<template>
  <div>
    <div v-if="game" :class="{ mobile: isMobile }">
      <page-tabs
        :currentPage="game.background.title"
        style="padding-left: 130px"
      ></page-tabs>

      <div class="usergame-container" v-if="isUserGame && userLoggedIn">
        <char-button
          class="user-button"
          :size="'small'"
          @click="triggerEditUserGame"
          >Edit</char-button
        >
        <char-button
          class="user-button"
          :size="'small'"
          @click="triggerDeleteUserGame"
          >Delete</char-button
        >
      </div>
      <div class="usergame-container" v-else-if="userLoggedIn">
        <char-button
          class="user-button"
          :size="'small'"
          @click="triggerCopyAndEditGame"
          >Make a copy and edit</char-button
        >
      </div>
      <div class="usergame-container" v-else>
        <login :size="'small'">Login to edit game</login>
      </div>

      <h1 :class="{ withcreator: getOwnerLink || getOwnerName }">
        <span class="border"></span>{{ game.background.title
        }}<span class="border back"></span>
      </h1>
      <div class="game-creator" v-if="getOwnerLink || getOwnerName">
        <span>From </span>
        <a v-if="getOwnerLink" :href="getOwnerLink" target="_blank">
          <span v-if="getOwnerName">{{ getOwnerName }}</span>
          <span v-else>{{ getOwnerLink }}</span>
        </a>
        <span v-else-if="getOwnerName">{{ getOwnerName }}</span>
      </div>

      <div class="background" :style="getBackgroundStyling"></div>
      <div
        id="content"
        class="content"
        :class="getContentContainerClasses"
        :style="getContainerHeight"
      >
        <div class="left">
          <div class="filter-button" @click="triggerShowFilter">
            <span v-if="!showFilter">Show Filter</span>
            <span v-else>Close filter</span>
          </div>
          <div class="filter-slider" :class="{ active: showFilter }">
            <table id="filter-table">
              <tr>
                <th colspan="3">Total available characters</th>
              </tr>
              <tr>
                <td colspan="3" class="total" :class="{ new: newAvailable }">
                  {{ availableCount }}
                </td>
              </tr>
              <tr>
                <th>Remove</th>
                <th>Filter</th>
                <th>Available</th>
              </tr>
              <tr
                v-for="(item, index) in getAllCategories"
                :class="{ remove: item.checked }"
                :id="'filter_' + index"
              >
                <td>
                  <input
                    type="checkbox"
                    :value="item.value"
                    @change="
                      event => {
                        filterCheckboxChecked(event, 'filter_' + index);
                      }
                    "
                    v-model="item.checked"
                  />
                </td>
                <td>{{ item.value }}</td>
                <td class="count">{{ item.count }}</td>
              </tr>
            </table>
            <ad-component
              ad-slot="YOUR_SIDEBAR_AD_SLOT"
              ad-format="vertical"
            ></ad-component>
          </div>
          <div class="button-container" :class="{ fixed: fixedScrolling }">
            <char-button
              class="draw"
              :color="'orange'"
              v-if="!startPicking"
              @click="triggerStartPicking"
            >
              <span>Start picking</span>
            </char-button>
            <char-button
              class="draw"
              v-else
              :color="'orange'"
              @click="pickNextChar"
            >
              <span>Pick next</span>
            </char-button>

            <div class="buttons-row">
              <char-button
                class="draw filter"
                :color="'black'"
                v-if="!startPicking"
                @click="triggerShowFilter"
              >
                <span v-if="!showFilter">Show Filter</span>
                <span v-else>Close filter</span>
              </char-button>
              <char-button
                class="draw toggle-selection"
                :color="'black'"
                v-if="!startPicking"
                @click="triggerToggleSelection"
              >
                <span v-if="toggleAllOff">Select all</span>
                <span v-else>Deselect all</span>
              </char-button>
            </div>

            <div class="usergame-container">
              <char-button
                class="user-button draw-next"
                v-if="startPicking"
                :size="'small'"
                @click="triggerStartPicking"
                >Pick again</char-button
              >
              <char-button
                class="user-button reset"
                v-if="startPicking"
                :size="'small'"
                @click="resetAllPicking"
                >Reset all</char-button
              >
            </div>
          </div>

          <char-tabs
            @clicked="triggerTabChange"
            :isMobile="isMobile"
            v-if="tabData.length > 1"
            :tabs="tabData"
          ></char-tabs>

          <table id="character-table">
            <tr>
              <th v-if="!isMobile">Remove</th>
              <th v-else>-</th>
              <th>Name</th>
              <th class="type">Type</th>
              <th class="from">From</th>
            </tr>
            <tr
              v-for="char in getFilteredGameChars"
              :class="{
                remove: char.remove,
                hover: char.hovered,
                current: char.selected,
                picked: char.picked
              }"
              @mouseover="
                event => {
                  displayPreview(char.index, event);
                }
              "
              @mouseout="
                event => {
                  tearDownDisplayPreview(char.index, event);
                }
              "
              @click="hoverClick"
            >
              <td>
                <input
                  :id="char.index"
                  v-model="char.remove"
                  @click="
                    event => {
                      characterCheckboxChecked(char.index);
                    }
                  "
                  type="checkbox"
                  :value="char.index"
                />
              </td>
              <td class="name">{{ char.name }}</td>
              <td class="type" v-html="changeTypeHtml(char.type)"></td>
              <td class="from">{{ char.container }}</td>
            </tr>
          </table>

          <img
            id="tumbnail"
            :src="thumbnailImg"
            class="tumbnail"
            :class="{ hidden: thumbnailHide, active: thumbnailActive }"
            :style="{
              top: thumbnailCssTop,
              left: thumbnailCssLeft,
              maxWidth: thumbnailZoomHeight,
              maxHeight: thumbnailZoomHeight
            }"
          />
        </div>
        <div
          class="right"
          :class="{
            fixed: fixedScrolling,
            display: displayPicked,
            down: animateDown
          }"
        >
          <img
            id="picture"
            :src="pictureImg"
            class="picture"
            :class="{ hidden: !startPicking }"
            :style="{ opacity: pictureOpacity }"
          />
        </div>
      </div>
      <div id="cover"></div>
      <div id="coverContent"></div>

      <div class="hidden-image-load" v-for="chars in getFilteredGameChars">
        <img :src="chars.image" />
      </div>
    </div>
    <!--<div v-else-if="!userLoggedIn">You are not logged in!</div>-->
  </div>
</template>

<script>
import { mapState, mapGetters, mapMutations } from "vuex";
import config from "../../../config/config";
import _ from "lodash";
import PageTabs from "../PageTabs/PageTabs";
import AdComponent from "../../components/AdComponent";
import CharTabs from "./CharTabs";
import CharButton from "../CharButton";
import Login from "../Login/Login";
let unknownPerson = "./unknown.png";

let blankState = () => {
  return {
    title: "Pick random",
    removingPreformed: false,
    toggleAllOff: false,
    selectedCharacterTabIndex: 0,
    isMobile: false,

    startPicking: false,
    animatePicking: false,
    displayPicked: false,
    animateDown: false,
    fixedScrolling: false,
    showFilter: false,
    newAvailable: false,
    pictureOpacity: 0,
    pictureImg: "",
    contentHeight: 0,
    availableCount: 0,

    thumbnailImg: "",
    thumbnailCssTop: 0,
    thumbnailCssLeft: 0,
    thumbnailHide: true,
    thumbnailActive: false,
    thumbnailZoomHeight: undefined
  };
};

export default {
  name: "CharacterPicker",
  components: { Login, CharButton, CharTabs, PageTabs, AdComponent },
  props: ["gameId"],
  data() {
    return blankState();
  },
  head: function() {
    let head = {};
    head.title = {
      inner: this.title
    };
    let url =
      this.game && this.game.background && this.game.background.thumbnail
        ? this.game.background.thumbnail
        : this.game && this.game.background && this.game.background.url
        ? this.game.background.url
        : undefined;
    if (url && !url.startsWith("http")) url = config.backendServer + "/" + url;
    head.meta = [];
    if (this.title)
      head.meta.push({
        property: "og:title",
        content: this.title + " - randomboardgame"
      });
    if (url) head.meta.push({ property: "og:image", content: url });

    return head;
  },
  computed: {
    ...mapGetters("user", ["userLoggedIn"]),
    ...mapState("game", ["game", "userGames", "isUserGame"]),
    getAllCategories() {
      let tab = this.game ? this.game.tabs[this.selectedCharacterTabIndex] : [];
      if (tab && tab.categories && tab.categories.all)
        return tab.categories.all;
      return [];
    },
    tabData() {
      return this.game ? this.game.tabs : [];
    },
    getFilteredGameChars() {
      return this.game
        ? this.game.tabs[this.selectedCharacterTabIndex].characters
        : [];
    },
    getOwnerName() {
      return this.game.settings && this.game.settings.contentOwnerName
        ? this.game.settings.contentOwnerName
        : undefined;
    },
    getOwnerLink() {
      return this.game.settings && this.game.settings.contentOwnerLink
        ? this.game.settings.contentOwnerLink
        : undefined;
    },
    getBackgroundStyling() {
      let styling = [];
      if (this.game && this.game.background && this.game.background.url) {
        let url = this.game.background.url;
        if (!url.startsWith("http")) url = config.backendServer + "/" + url;
        styling.push('background-image: url("' + url + '")');
      }
      if (this.game && this.game.background && this.game.background.color)
        styling.push("background-color: " + this.game.background.color);
      if (this.game && this.game.background && this.game.background.transparent)
        styling.push("opacity: " + this.game.background.transparent);
      return styling.join(";");
    },
    getContentContainerClasses() {
      let classes = [];
      if (this.startPicking) classes.push("picking");
      if (
        this.game &&
        this.game.settings &&
        this.game.settings.contentContainer
      )
        classes.push(this.game.settings.contentContainer);
      return classes.join(" ");
    },
    getContainerHeight() {
      return this.contentHeight ? "height:" + this.contentHeight + "px" : "";
    }
  },
  methods: {
    ...mapMutations("page", ["setLoadingSpinner"]),
    autoSave() {
      this.$store.commit("game/setGame", this.game);
    },
    triggerEditUserGame() {
      this.$router.push({ name: "EditGame", params: { id: this.game.id } });
    },
    async triggerDeleteUserGame() {
      if (
        confirm(
          "Are you sure you want to delete this game? Data can not be restored"
        )
      ) {
        let answer = await this.$store.dispatch(
          "game/deleteUserGame",
          this.game.id
        );
        if (answer && answer.deleted) {
          this.$router.replace({ name: "GameSelection" });
        }
      }
    },
    async triggerCopyAndEditGame() {
      let savedId = await this.$store.dispatch("game/saveUserGame", this.game);
      this.$router.replace({ name: "EditGame", params: { id: savedId } });
    },
    triggerTabChange(index) {
      this.selectedCharacterTabIndex = index;
      let preformedPicking = false;
      this.game.tabs[this.selectedCharacterTabIndex].characters.forEach(
        char => {
          if (char.picked || char.selected || (char.remove && !char.skipp)) {
            preformedPicking = true;
          }
        }
      );
      if (preformedPicking) {
        this.triggerStartPicking(true);
      } else {
        this.resetAllPicking();
      }
      this.reCountAllFilters();
    },
    changeTypeHtml(value) {
      return value.replace(/\//g, " / <wbr>");
    },
    filterCheckboxChecked(event, index) {
      let self = this;
      let target = event.target;
      let targetValue = target ? target.value : event;
      targetValue = targetValue.split("/");
      let checkedIndex =
        index.constructor === String
          ? parseInt(index.replace("filter_", ""))
          : index;
      const checkedItem = this.game.tabs[this.selectedCharacterTabIndex]
        .categories.all[checkedIndex];
      if (checkedItem.checked) {
        this.game.tabs[this.selectedCharacterTabIndex].characters.forEach(
          char => {
            const objectType = char.type.split("/");
            const objectContainer = char.container.split("/");
            if (
              _.intersection(targetValue, objectType).length > 0 ||
              _.intersection(targetValue, objectContainer).length > 0
            ) {
              char.skipp = true;
              char.remove = true;
            }
          }
        );
      } else {
        this.game.tabs[this.selectedCharacterTabIndex].characters.forEach(
          char => {
            const objectType = char.type.split("/");
            const objectContainer = char.container.split("/");
            if (
              (_.intersection(targetValue, objectType).length > 0 ||
                _.intersection(targetValue, objectContainer).length > 0) &&
              !isObjectDualChecked(objectType, objectContainer)
            ) {
              char.skipp = false;
              char.remove = false;
            }
          }
        );
      }
      this.reCountAllFilters();
      //this.autoSave();

      function isObjectDualChecked(objectType, objectContainer) {
        let tab = self.game.tabs[self.selectedCharacterTabIndex];
        let filterValues =
          tab && tab.categories && tab.categories.all ? tab.categories.all : [];
        const checkedInputs = _.filter(filterValues, cat => {
          return cat.checked;
        });
        let checkCount = 0;
        for (let i = 0; i < checkedInputs.length; i++) {
          let checkboxValue = checkedInputs[i].value.split("/");
          if (
            _.intersection(checkboxValue, objectType).length > 0 ||
            _.intersection(checkboxValue, objectContainer).length > 0
          ) {
            checkCount++;
          }
        }
        return checkCount > 0;
      }
    },
    characterCheckboxChecked(index) {
      this.game.tabs[this.selectedCharacterTabIndex].characters[
        index
      ].skipp = document.getElementById(index).checked;
      this.removingPreformed = true;
      this.reCountAllFilters();
      this.autoSave();
    },
    reCountAllFilters(init) {
      let self = this;
      let tab = this.game.tabs[this.selectedCharacterTabIndex];
      let loopValues =
        tab && tab.categories && tab.categories.all ? tab.categories.all : [];
      loopValues.forEach(cat => {
        let filterValues = cat.value.split("/");
        let count = 0;
        this.game.tabs[this.selectedCharacterTabIndex].characters.forEach(
          char => {
            if (
              _.intersection(filterValues, char.type.split("/")).length > 0 ||
              _.intersection(filterValues, char.container.split("/")).length > 0
            ) {
              if (char.remove === false) count += 1;
            }
          }
        );
        if (count === 0 && init) cat.checked = true;
      });
      let count = 0;
      this.game.tabs[this.selectedCharacterTabIndex].characters.forEach(
        char => {
          if (char.remove === false) count += 1;
        }
      );
      this.availableCount = count;
      this.newAvailable = true;
      setTimeout(function() {
        self.newAvailable = false;
      }, 100);
      //this.autoSave();
    },
    tearDownDisplayPreview(index) {
      this.game.tabs[this.selectedCharacterTabIndex].characters[
        index
      ].hovered = false;
      this.thumbnailHide = true;
      this.thumbnailActive = false;
      this.thumbnailZoomHeight = undefined;
    },
    hoverClick() {
      if (this.isMobile) {
        if (!this.thumbnailActive) {
          this.thumbnailHide = false;
          this.thumbnailActive = true;
          if (
            this.game &&
            this.game.settings &&
            this.game.settings.zoomHeight
          ) {
            this.thumbnailZoomHeight = this.game.settings.zoomHeight + "px";
          }
        } else {
          this.thumbnailHide = true;
          this.thumbnailActive = false;
        }
      } else {
        this.thumbnailActive = true;
        if (this.game && this.game.settings && this.game.settings.zoomHeight) {
          this.thumbnailZoomHeight = this.game.settings.zoomHeight + "px";
        }
      }
    },
    displayPreview(index, event) {
      let currentHovered = this.game.tabs[this.selectedCharacterTabIndex]
        .characters[index];
      currentHovered.hovered = true;
      this.thumbnailImg =
        currentHovered.image !== undefined
          ? currentHovered.image
          : unknownPerson;
      this.thumbnailCssTop = event.layerY + 40 + "px";
      this.thumbnailCssLeft =
        event.layerX -
        document.getElementById("tumbnail").offsetWidth / 2 +
        "px";
      if (this.isMobile) this.thumbnailCssLeft = "1%";
      this.thumbnailHide = false;
    },
    triggerShowFilter() {
      this.showFilter = this.showFilter ? false : true;
    },
    triggerToggleSelection() {
      let self = this;
      let preformToggle = () => {
        self.toggleAllOff = !self.toggleAllOff ? true : false;
        self.game.tabs[self.selectedCharacterTabIndex].categories.all.forEach(
          (cat, index) => {
            cat.checked = self.toggleAllOff;
            self.filterCheckboxChecked(cat.value, index);
          }
        );
        self.reCountAllFilters();
      };

      if (this.removingPreformed) {
        let selection = !this.toggleAllOff ? "deselect" : "select";
        if (
          confirm(
            "You have already manually removed/added something on the list. Are you sure you want to " +
              selection +
              " everything?"
          )
        ) {
          preformToggle();
          this.removingPreformed = false;
        }
      } else {
        preformToggle();
      }
    },
    triggerStartPicking(skippFirstPick = false) {
      if (!this.startPicking)
        this.contentHeight =
          document.getElementById("content").offsetHeight + 600;

      this.startPicking = true;
      if (!skippFirstPick) this.animateRandomPick();
    },
    resetAllPicking() {
      this.contentHeight = 0;
      this.startPicking = false;
      this.pictureOpacity = 0;
      this.game.tabs[this.selectedCharacterTabIndex].characters.forEach(
        char => {
          char.picked = false;
          char.selected = false;
          if (!char.skipp) char.remove = false;
        }
      );
    },
    pickNextChar() {
      if (this.animatePicking) {
        return;
      }
      this.game.tabs[this.selectedCharacterTabIndex].characters.forEach(
        char => {
          if (char.selected && !char.remove) {
            char.remove = true;
            char.picked = true;
          }
        }
      );
      this.animateRandomPick();
    },
    animateRandomPick() {
      if (!config.debug) {
        this.$ga.event({
          eventCategory: "CharacterPicker",
          eventAction: "picking"
        });
      }
      if (this.animatePicking) {
        return;
      }
      let self = this;
      this.pictureOpacity = 0;
      setTimeout(function() {
        self.pictureImg = unknownPerson;
      }, 500);
      this.animatePicking = true;
      let abortPicking = false;
      _.forEach(_.range(0, 101), function(value, index) {
        setTimeout(function() {
          if (!abortPicking) {
            abortPicking = drawOneRandom(index === 100);
          }
          if (index === 100) {
            self.animatePicking = false;
            self.displayPicked = true;
            setTimeout(() => {
              self.animateDown = true;
            }, 1500);
            setTimeout(() => {
              self.displayPicked = false;
              self.animateDown = false;
            }, 2000);
          }
        }, 10 * index);
      });

      function drawOneRandom(finalPick) {
        let available = _.filter(
          _.clone(self.game.tabs[self.selectedCharacterTabIndex].characters),
          function(value) {
            return value.remove === false && value.skipp === false;
          }
        );
        if (available.length <= 0) {
          alert("All characters picked!");
          return true;
        }
        let currentPicked = _.first(_.shuffle(available));
        markPickedTable(currentPicked);
        if (finalPick) {
          self.pictureImg =
            currentPicked.image !== undefined
              ? currentPicked.image
              : unknownPerson;
          self.pictureOpacity = 1;
        }
        return false;

        function markPickedTable(char) {
          resetPicked();
          self.game.tabs[self.selectedCharacterTabIndex].characters[
            char.index
          ].selected = true;
          if (finalPick) {
            document.getElementById(char.index).focus();
          }
        }

        function resetPicked() {
          self.game.tabs[self.selectedCharacterTabIndex].characters.forEach(
            char => {
              char.selected = false;
            }
          );
        }
      }
    }
  },
  async destroyed() {
    let self = this;
    let obj = blankState();
    Object.keys(obj).forEach(key => {
      self[key] = obj[key];
    });
    this.$store.commit("game/clearGame");
  },
  async mounted() {
    let w;
    w = window ? window.innerWidth : w;
    w =
      document && document.documentElement
        ? document.documentElement.clientWidth
        : w;
    w = document && document.body ? document.body.clientWidth : w;
    this.isMobile = w < 990;

    let self = this;
    this.$store.commit("page/setLoadingSpinner", true);

    let waitOnUserLoad = async index => {
      if (!self.userGames && index < 10) {
        setTimeout(() => {
          return waitOnUserLoad(index + 1);
        }, 50);
      } else {
        this.$store.commit("page/setLoadingSpinner", false);
        let idSplit = window.location.href.split("/");
        await this.$store.dispatch(
          "game/downloadGame",
          idSplit[idSplit.length - 1]
        );
        if (this.game && this.game.background && this.game.background.title) {
          this.title = this.game.background.title;
          self.$emit("updateHead");
        }
        this.reCountAllFilters(true);
        this.autoSave();

        document.addEventListener("scroll", () => {
          var scrollTop =
            (window.pageYOffset || document.scrollTop) -
            (document.clientTop || 0);
          self.fixedScrolling = scrollTop > 130;
        });
      }
    };
    waitOnUserLoad(0);
    //(this.userLoggedIn) ? waitOnUserLoad(0) : waitOnUserLoad(10);
  }
};
</script>

<style lang="less">
.buttons-row {
  .draw {
    display: inline-block;
    margin-left: 30px;
    &:first-child {
      margin-left: 0;
    }
    @media (max-width: 650px) {
      margin-left: 0;
    }
  }
}
.button-container {
  margin-bottom: 20px;
  &.fixed {
    position: fixed;
    left: 20px;
    top: 100px;
    width: 126px;
    z-index: 1;
    .draw {
      margin-left: 0;
      &.filter {
        display: none;
      }
      &.toggle-selection a {
        font-size: 16px;
        background: white;
        &:hover {
          background: #bdbdbd;
        }
      }
    }
    .button-container {
      margin-bottom: 0;
      a {
        min-width: 120px !important;
        margin-bottom: 20px;
        padding: 15px 10px;
      }
    }
    .usergame-container {
      .user-button {
        width: 126px;
        margin: 0;
        display: inline-block;
      }
    }
  }
}
</style>

<style scoped lang="less">
.mobile {
  .content {
    margin: 60px 0;
    width: 100%;
    &.picking {
      margin: 60px 0;
      width: 100%;
    }
    .left {
      table {
        width: 100%;
        td {
          padding: 10px 2px;
          font-size: 12px;
          border-bottom: 1px solid black;
          &.type {
            width: 30%;
          }
          &.from {
            width: 20%;
          }
        }
        input {
          width: 17px;
        }
      }
      img.tumbnail {
        &.active {
          max-width: 96% !important;
        }
      }
    }
  }
}

.usergame-container {
  .user-button {
    margin: 5px;
    display: inline-block;
  }
}
h1 {
  &.withcreator {
    margin-bottom: 10px;
  }
}
.game-creator {
  margin-bottom: 80px;
  a {
    color: #f76331;
  }
}
.content {
  .left {
    .filter-button {
      display: block;
      color: #222;
      background: transparent;
      position: fixed;
      text-transform: uppercase;
      font-size: 20px;
      padding: 20px 10px;
      top: 0;
      left: 20px;
      width: 100px;
      border: 3px solid #000;
      border-top: transparent;
      border-radius: 0 0 3px 3px;
      cursor: pointer;
      &:hover {
        background: #cccccc;
      }
    }

    .filter-slider {
      position: fixed;
      width: 25%;
      z-index: 10;
      top: 100px;
      left: -100%;
      max-height: 80%;
      -webkit-transition: left 0.5s;
      -moz-transition: left 0.5s;
      -o-transition: left 0.5s;
      transition: left 0.5s;
      &.active {
        left: 0;
        border: 1px solid black;
        background: #eeeeee;
        padding: 20px 20px 20px 0;
        overflow-y: scroll;
        overflow-x: hidden;
      }
    }

    table {
      width: 90%;
      display: inline-table;
      border: 1px solid black;
      border-radius: 3px;
      border-collapse: collapse;
      background: #ffffff;
      th {
        background: #222222;
        color: #ffffff;
        padding: 6px 0;
      }
      td {
        text-align: center;
        &.name {
          text-transform: uppercase;
        }
        &.total {
          -webkit-transition: font-size 0.5s;
          -moz-transition: font-size 0.5s;
          -o-transition: font-size 0.5s;
          transition: font-size 0.5s;
          font-size: 24px;
          height: 35px;
          &.new {
            -webkit-transition: font-size 0.1s;
            -moz-transition: font-size 0.1s;
            -o-transition: font-size 0.1s;
            transition: font-size 0.1s;
            font-size: 0;
          }
        }
      }
    }

    table#filter-table {
      width: 100%;
      th,
      td {
        /*padding: 0 20px 0 10px;*/
      }
    }

    img.tumbnail {
      position: absolute;
      max-width: 200px;
      max-height: 200px;
      border: 1px solid black;
      z-index: 50;
      &.active {
        max-width: 400px;
        max-height: 400px;
        border: 3px solid black;
        border-radius: 20px;
        -webkit-transition: all 1s;
        -moz-transition: all 1s;
        -o-transition: all 1s;
        transition: all 1s;
      }
    }

    input {
      width: 55px;
      height: 17px;
    }
  }

  .right {
    img {
      max-width: 90%;
      height: auto;
      border-radius: 60px;
      border: 3px solid black;
      display: inline-block;
      &.picture {
        transition: 0.5s opacity;
      }
    }
  }
}

tr td {
  -webkit-transition: background 0.5s, color 0.5s;
  -moz-transition: background 0.5s, color 0.5s;
  -o-transition: background 0.5s, color 0.5s;
  transition: background 0.5s, color 0.5s;
}

tr.remove td {
  text-decoration: line-through;
  background: grey;
  color: #ccc;
}
tr.current td {
  animation: pulse 1s infinite;
  color: white !important;
}

@keyframes pulse {
  0% {
    background-color: #038021;
  }
  50% {
    background-color: #25b308;
  }
  100% {
    background-color: #038021;
  }
}
tr.hover td {
  background-color: #5ec1ff;
  color: black;
}

tr.picked td {
  background-color: #fffc8d;
  color: black;
  height: 24px;
}
tr.picked td input {
  display: none;
}

@media (max-width: 990px) {
  .content .left .filter-button {
    position: initial;
    width: auto;
    display: inline-block;
    font-size: 14px;
    border-radius: 2px;
    margin-bottom: 20px;
    padding: 10px 30px;
    font-weight: bold;
    border-top: 3px solid black;
  }

  .content .left .filter-slider {
    position: initial;
    max-height: 0px;
    overflow: hidden;
    width: auto;
    max-height: auto;
    -webkit-transition: max-height 0.5s;
    -moz-transition: max-height 0.5s;
    -o-transition: max-height 0.5s;
    transition: max-height 0.5s;
  }

  .content .left .filter-slider.active {
    max-height: 1000px;
    padding: 20px;
    margin-bottom: 20px;
    overflow: hidden;
  }

  .content .left .button-container.fixed {
    top: 20px;
  }
}

body {
  position: relative;
  font-family: sans-serif;
}

h3 {
  font-size: 23px;
  margin: 0 0 20px 0;
  color: white;
}

#cover {
  position: fixed;
  top: 0;
  left: 0;
  background: black;
  opacity: 0;
  z-index: 30;
  width: 0;
  height: 0;
  -webkit-transition: opacity 0.65s;
  -moz-transition: opacity 0.65s;
  -o-transition: opacity 0.65s;
  transition: opacity 0.65s;
}

#cover.active {
  opacity: 0.75;
  width: 100%;
  height: 100%;
}

#coverContent {
  position: fixed;
  top: 100%;
  z-index: 31;
  background: white;
  margin: 0 10%;
  padding: 50px 5%;
  max-height: 65%;
  overflow-y: scroll;
  /*overflow-y: scroll;*/
  text-align: center;
  width: 70%;
  border-radius: 20px;
  -webkit-transition: top 0.75s;
  -moz-transition: top 0.75s;
  -o-transition: top 0.75s;
  transition: top 0.75s;
}

#coverContent .button {
  background: #444;
  border: 3px solid black;
  text-decoration: initial;
  font-size: 25px;
  color: white;
  padding: 20px;
  width: 60%;
  display: inline-block;
  border-radius: 20px;
  margin-bottom: 10px;
}

#coverContent .button:hover {
  background: #666;
}

#coverContent.active {
  position: fixed;
  top: 120px;
}

.background {
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 50%;
  position: fixed;
  top: 0;
  height: 100%;
  width: 100%;
  z-index: -1;
}

.content {
  margin: 120px 10%;
  width: 80%;
  /*font-size: 0;*/
  text-align: center;
  opacity: 1;
  /* position: absolute; */
  z-index: 10;
}

.content .left,
.content .right {
  margin-top: 30px;
  width: 100%;
  display: inline-block;
  vertical-align: top;
  text-align: center;
  -webkit-transition: width 0.5s;
  -moz-transition: width 0.5s;
  -o-transition: width 0.5s;
  transition: width 0.5s;
}

.content.picking .left {
  float: left;
}

.content.picking .left,
.content.picking .right {
  width: 50%;
}

.content.picking.bigger {
  margin: 120px 0 120px 10%;
  width: 90%;
  .left {
    width: 40%;
  }
  .right {
    width: 60%;
    &.fixed {
      width: 55%;
      left: 44%;
    }
  }
  @media (max-width: 1550px) {
    .left {
      width: 45%;
    }
    .right {
      width: 55%;
      &.fixed {
        width: 50%;
        left: 48%;
      }
    }
  }
  @media (max-width: 1450px) {
    .left {
      width: 50%;
    }
    .right {
      width: 50%;
      &.fixed {
        width: 45%;
        left: 52%;
      }
    }
  }
  @media (max-width: 1350px) {
    margin: 120px 5% 120px 15%;
    width: 80%;
    .left {
      width: 50%;
    }
    .right {
      width: 50%;
      &.fixed {
        width: 45%;
        left: 57%;
      }
    }
  }
  @media (max-width: 1200px) {
    margin: 120px 2.5% 120px 17.5%;
    .left {
      width: 50%;
    }
    .right {
      width: 40%;
      &.fixed {
        width: 40%;
        left: 60%;
      }
    }
  }
  @media (max-width: 1100px) {
    margin: 120px 0% 120px 20%;
    .left {
      width: 65%;
    }
    .right {
      width: 35%;
      &.fixed {
        width: 30%;
        left: 70%;
      }
    }
  }
}

.content .right.fixed {
  position: fixed;
  left: 50%;
  top: 0px;
  width: 40%;
  height: 0;
  overflow: hidden;
  @media (max-width: 1200px) {
    left: 55%;
  }
  @media (max-width: 1100px) {
    left: 60%;
  }
}

.content.picking .right.fixed {
  height: auto;
  overflow: auto;
}

.hidden,
.hidden-image-load {
  display: none;
}

@media (max-width: 990px) {
  .tabs {
    padding-left: 0 !important;
  }
  .content {
    margin: 120px 5%;
    width: 90%;
  }
  .content .left table td {
    word-break: break-word;
  }
  .content.picking {
    margin: 120px 5%;
  }
  .content.picking.bigger {
    margin: 120px 10%;
  }
  .content.picking .left,
  .content.picking .right,
  .content.picking.bigger .left,
  .content.picking.bigger .right {
    width: 100%;
  }

  .content.picking .right.display,
  .content.picking .right.fixed.display,
  .content.picking.bigger .right.display,
  .content.picking.bigger .right.fixed.display {
    position: fixed;
    left: 0;
    top: 25%;
    transition: top 0.5s;
    &.down {
      top: 100%;
    }
  }

  .content .right.fixed,
  .content.bigger .right.fixed,
  .content.picking .right.fixed,
  .content.picking.bigger .right.fixed {
    position: initial;
    width: 100%;
  }
}
</style>
<style lang="less">
@media (max-width: 990px) {
  .content {
    .button-container.fixed {
      .user-button a {
        background: #c4c4c4;
      }
    }
  }
}
</style>
