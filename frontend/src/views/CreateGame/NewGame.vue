<template>
  <div class="game-setup" v-if="userLoggedIn">
    <page-tabs :currentPage="currentGame.background.title"></page-tabs>

    <div class="open-overview">
      <char-button @click="toggleOverview">
        <span v-if="!openOverview">OPEN GAME SETTINGS</span>
        <span v-else>CLOSE GAME SETTINGS</span>
      </char-button>
    </div>
    <div class="overview" :class="{ closed: !openOverview }">
      <div class="input-container">
        <label>Title <span class="required">*</span></label>
        <input
          :class="{
            changed: isOverviewChanged(currentGame.background.title, 'title')
          }"
          type="text"
          placeholder="Title"
          required
          v-model="currentGame.background.title"
          @focus="storeChange(currentGame.background.title, 'title')"
          @blur="storeChange(currentGame.background.title, 'title')"
        />
      </div>
      <div class="input-container">
        <label
          >Background image url (optional, link to an image hosted somewhere.
          Like Imgur, Dropbox og Google image search.)</label
        >
        <input
          :class="{
            changed: isOverviewChanged(currentGame.background.url, 'url')
          }"
          type="text"
          placeholder="Background url"
          v-model="currentGame.background.url"
          @focus="storeChange(currentGame.background.url, 'url')"
          @blur="storeChange(currentGame.background.url, 'url')"
        />
      </div>
      <div class="input-container" v-if="!currentGame.background.url">
        <label
          >Background color (<a
            href="https://www.google.com/search?q=color+picker"
            target="_blank"
            >HEX-code</a
          >) (optional, color only displayed when no background image url is
          set)</label
        >
        <input
          :class="{
            changed: isOverviewChanged(currentGame.background.color, 'color')
          }"
          type="text"
          placeholder="Background color"
          v-model="currentGame.background.color"
          @focus="storeChange(currentGame.background.color, 'color')"
          @blur="storeChange(currentGame.background.color, 'color')"
        />
      </div>
      <div class="input-container">
        <label
          >Opacity background (1 = no opacity, 0.5 = 50% opacity, 0 = 100%
          opacity)</label
        >
        <input
          :class="{
            changed: isOverviewChanged(
              currentGame.background.transparent,
              'transparent'
            )
          }"
          type="number"
          min="0"
          max="1"
          step="0.05"
          placeholder="Opacity background"
          v-model="currentGame.background.transparent"
          @focus="
            storeChange(currentGame.background.transparent, 'transparent')
          "
          @blur="storeChange(currentGame.background.transparent, 'transparent')"
        />
      </div>
      <hr v-if="currentGame.background.url" />
      <div class="input-container" v-if="currentGame.background.url">
        <label
          >Frontpage thumbnail image url (optional, used for frontpage if the
          normal background image is not a great fit)</label
        >
        <input
          :class="{
            changed: isOverviewChanged(
              currentGame.background.thumbnail,
              'thumbnail'
            )
          }"
          type="text"
          placeholder="Thumbnail image url"
          v-model="currentGame.background.thumbnail"
          @focus="storeChange(currentGame.background.thumbnail, 'thumbnail')"
          @blur="storeChange(currentGame.background.thumbnail, 'thumbnail')"
        />
      </div>
      <hr />
      <div class="input-container">
        <label
          >How big should the image on characters display when clicked
          (optional, size in pixel)</label
        >
        <input
          :class="{
            changed: isOverviewChanged(
              currentGame.settings.zoomHeight,
              'zoomHeight'
            )
          }"
          type="number"
          min="100"
          max="1000"
          step="10"
          placeholder="Hover image pixel size"
          v-model="currentGame.settings.zoomHeight"
          @focus="storeChange(currentGame.settings.zoomHeight, 'zoomHeight')"
          @blur="storeChange(currentGame.settings.zoomHeight, 'zoomHeight')"
        />
      </div>
      <div class="input-container checkbox">
        <label>Display bigger image after picking?</label>
        <input
          type="checkbox"
          v-model="biggerImage"
          @click="storeChange(biggerImage, 'biggerImage', true)"
          @change="
            triggerBiggerImage();
            storeChange(biggerImage, 'biggerImage');
          "
        />
        <span
          :class="{ changed: isOverviewChanged(biggerImage, 'biggerImage') }"
          >Yes, pretty please.</span
        >
      </div>
      <hr />
      <div class="input-container">
        <label
          >Name of the game company that made the game (optional, used for
          crediting them)</label
        >
        <input
          :class="{
            changed: isOverviewChanged(
              currentGame.settings.contentOwnerName,
              'contentOwnerName'
            )
          }"
          type="text"
          placeholder="Game company name"
          v-model="currentGame.settings.contentOwnerName"
          @focus="
            storeChange(
              currentGame.settings.contentOwnerName,
              'contentOwnerName'
            )
          "
          @blur="
            storeChange(
              currentGame.settings.contentOwnerName,
              'contentOwnerName'
            )
          "
        />
      </div>
      <div class="input-container">
        <label
          >Link to the game company that made the game (optional, used for
          crediting them)</label
        >
        <input
          :class="{
            changed: isOverviewChanged(
              currentGame.settings.contentOwnerLink,
              'contentOwnerLink'
            )
          }"
          type="text"
          placeholder="Game company link"
          v-model="currentGame.settings.contentOwnerLink"
          @focus="
            storeChange(
              currentGame.settings.contentOwnerLink,
              'contentOwnerLink'
            )
          "
          @blur="
            storeChange(
              currentGame.settings.contentOwnerLink,
              'contentOwnerLink'
            )
          "
        />
      </div>
    </div>
    <div
      class="background"
      :style="{
        backgroundImage: 'url(' + currentGame.background.url + ')',
        backgroundColor: currentGame.background.color,
        opacity: currentGame.background.transparent,
        backgroundSize: 'cover'
      }"
    ></div>
    <div>
      <h1 :class="{ withcreator: getOwnerLink || getOwnerName }">
        <span class="border"></span>{{ currentGame.background.title
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
    </div>

    <div class="changes" v-if="changesFound">
      <h3>Remember to save your changes before closing the browser window!</h3>
    </div>
    <div class="store-actions">
      <char-button :color="'black'" @click="triggerNewSave" v-if="!gameLoaded"
        >Create new game</char-button
      >
      <div class="button-wrapper" v-else>
        <char-button
          :size="'small'"
          @click="triggerEditSave"
          v-if="changesFound"
          >Save game</char-button
        >
        <char-button :size="'small'" @click="triggerTestGame"
          >Test game</char-button
        >
        <char-button
          :size="'small'"
          @click="triggerDeleteUserGame"
          class="user-button"
          >Delete</char-button
        >
      </div>
    </div>

    <char-tabs
      @clicked="triggerTabChange"
      @removeTab="removeTab"
      @newTab="newTab"
      :tabs="tabData"
      :editable="true"
    ></char-tabs>
    <table
      id="character-table"
      v-for="(tab, tIndex) in currentGame.tabs"
      v-if="selectedCharacterTabIndex === tIndex"
    >
      <tr>
        <th class="remove">
          Remove<br />
          when loaded
        </th>
        <th>Name</th>
        <th>Type</th>
        <th>From</th>
        <th>Image</th>
        <th class="actions">Actions</th>
      </tr>
      <tr
        v-for="(char, cIndex) in tab.characters"
        :class="{ 'checked-remove': char.remove }"
      >
        <td class="remove" :class="{ changed: isChanged(char, 'remove', 0) }">
          <input
            type="checkbox"
            name="name"
            v-model="char.remove"
            @click="storeChange(char.remove, char.uuid[0], true)"
            @change="storeChange(char.remove, char.uuid[0])"
          />
        </td>
        <td class="name" :class="{ changed: isChanged(char, 'name', 1) }">
          <input
            type="text"
            name="name"
            v-model="char.name"
            @focus="storeChange(char.name, char.uuid[1])"
            @blur="storeChange(char.name, char.uuid[1])"
          />
        </td>
        <td :class="{ changed: isChanged(char, 'type', 3) }">
          <input
            type="text"
            name="type"
            v-model="char.type"
            @focus="storeChange(char.type, char.uuid[3])"
            @blur="storeChange(char.type, char.uuid[3])"
          />
        </td>
        <td :class="{ changed: isChanged(char, 'container', 2) }">
          <input
            type="text"
            name="container"
            v-model="char.container"
            @focus="storeChange(char.container, char.uuid[2])"
            @blur="storeChange(char.container, char.uuid[2])"
          />
        </td>
        <td :class="{ changed: isChanged(char, 'image', 4) }">
          <input
            type="text"
            name="image"
            v-model="char.image"
            @focus="storeChange(char.image, char.uuid[4])"
            @blur="storeChange(char.image, char.uuid[4])"
          />
        </td>
        <td class="actions">
          <button>
            <img
              src="../../../public/icons/add.png"
              @click="addNewCharRow(tIndex, cIndex)"
            />
          </button>
          <button>
            <img
              src="../../../public/icons/remove.png"
              @click="removeNewCharRow(tIndex, cIndex)"
            />
          </button>
          <button>
            <img
              src="../../../public/icons/arrow_up.png"
              @click="moveUpCharRow(tIndex, cIndex)"
            />
          </button>
          <button>
            <img
              src="../../../public/icons/arrow_down.png"
              @click="moveDownCharRow(tIndex, cIndex)"
            />
          </button>
        </td>
      </tr>
    </table>

    <div class="missing-chars" v-if="isMissingGameDiff">
      <char-button class="missing-chars-button" @click="toggleMissingDiff">
        <span v-if="!openMissingDiff">Show</span><span v-else>Hide</span> whats
        missing in my list from the original data set
      </char-button>
      <div class="missing-chars-container" :class="{ active: openMissingDiff }">
        <table
          id="missing-character-table"
          v-for="(tab, tIndex) in getMainGameDiff.tabs"
          v-if="tab && tab.characters && tab.characters.length > 0"
        >
          <tr>
            <th
              colspan="5"
              style="text-align: left; padding-left: 10px; font-size: 26px"
            >
              {{ tab.title }}
            </th>
          </tr>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>From</th>
            <th>Image</th>
            <th class="actions">Actions</th>
          </tr>
          <tr v-for="(char, cIndex) in tab.characters">
            <td style="text-align: left" class="name">{{ char.name }}</td>
            <td style="text-align: left">{{ char.container }}</td>
            <td style="text-align: left">{{ char.type }}</td>
            <td style="text-align: left">{{ char.image }}</td>
            <td class="actions">
              <button title="Add back to your list">
                <img
                  src="../../../public/icons/add.png"
                  @click="addCharBack(char.tIndex, char.cIndex)"
                />
              </button>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import CharButton from "../CharButton";
import uuid from "uuid";
import config from "../../../config/config";
import CharTabs from "../CharacterPicker/CharTabs";
import PageTabs from "../PageTabs/PageTabs";

let blankState = () => {
  return {
    tabs: [
      {
        title: undefined,
        characters: [blankCharacterState()]
      }
    ],
    settings: {
      zoomHeight: 200,
      contentContainer: undefined,
      contentOwnerName: undefined,
      contentOwnerLink: undefined
    },
    background: {
      title: undefined,
      url: undefined,
      color: undefined,
      transparent: 0.5
    }
  };
};
let blankCharacterState = () => {
  return {
    index: undefined,
    uuid: [uuid(), uuid(), uuid(), uuid(), uuid()],
    remove: false,
    name: undefined,
    container: undefined,
    type: undefined,
    image: undefined
  };
};

export default {
  name: "NewGame",
  components: { PageTabs, CharTabs, CharButton },
  data() {
    return {
      openMissingDiff: false,
      openOverview: true,
      biggerImage: false,
      changesFound: false,
      selectedCharacterTabIndex: 0,
      changes: {},
      gameLoaded: false,
      currentGame: blankState(),
      mainGameDiff: undefined
    };
  },
  computed: {
    ...mapGetters("user", ["userLoggedIn", "getUserNameByEmail"]),
    ...mapGetters("game", ["getGame"]),
    ...mapState("game", ["userGames"]),
    tabData() {
      return this.currentGame && this.currentGame.tabs
        ? this.currentGame.tabs
        : [];
    },
    getOwnerName() {
      return this.currentGame.settings &&
        this.currentGame.settings.contentOwnerName
        ? this.currentGame.settings.contentOwnerName
        : undefined;
    },
    getOwnerLink() {
      return this.currentGame.settings &&
        this.currentGame.settings.contentOwnerLink
        ? this.currentGame.settings.contentOwnerLink
        : undefined;
    },
    isMissingGameDiff() {
      let game = this.getMainGameDiff;
      let found = false;
      game.tabs.forEach(tab => {
        if (tab.characters && tab.characters.length > 0) found = true;
      });
      return found;
    },
    getMainGameDiff() {
      let tabs = [];
      if (this.mainGameDiff) {
        try {
          tabs = JSON.parse(JSON.stringify(this.mainGameDiff.tabs));
        } catch (e) {}
        tabs = tabs.map((tab, tIndex) => {
          let foundChars = [];
          let useIndex =
            this.currentGame.tabs.length > tIndex
              ? tIndex
              : this.currentGame.tabs.length - 1;
          let characters = this.currentGame.tabs[useIndex].characters.map(
            char => {
              // TODO Need to check if index is found on current game
              return char && char.name ? char.name.toLowerCase() : undefined;
            }
          );
          tab.characters.forEach((char, cIndex) => {
            if (characters.indexOf(char.name.toLowerCase()) === -1) {
              char.tIndex = tIndex;
              char.cIndex = cIndex;
              foundChars.push(char);
            }
          });
          tab.characters = foundChars;
          return tab;
        });
      }
      return {
        tabs: tabs
      };
    }
  },
  methods: {
    toggleMissingDiff() {
      this.openMissingDiff = this.openMissingDiff ? false : true;
    },
    toggleOverview() {
      this.openOverview = this.openOverview ? false : true;
    },
    triggerBiggerImage() {
      this.currentGame.settings.contentContainer = this.biggerImage
        ? "bigger"
        : undefined;
    },
    newTab() {
      this.currentGame.tabs.push({
        title: undefined,
        characters: [blankCharacterState()]
      });
      this.changesFound = true;
      this.changes[uuid()] = "addedTab";
      this.triggerTabChange(this.currentGame.tabs.length - 1);
    },
    removeTab(index) {
      if (
        confirm(
          "Are you sure you want to delete tab from the game? Data can not be restored!"
        )
      ) {
        this.currentGame.tabs.splice(index, 1);
        this.changesFound = true;
        this.changes[uuid()] = "removedTab";
        this.triggerTabChange(0);
      }
    },
    triggerTabChange(index) {
      this.selectedCharacterTabIndex = index;
    },
    isChanged(char, type, uuidIndex) {
      let value = char[type];
      value = value ? value : "";
      let uuid = char.uuid ? char.uuid[uuidIndex] : undefined;
      if (uuid && this.changes[uuid] === undefined) return false;
      return uuid && this.changes[uuid] !== value;
    },
    isOverviewChanged(value, uuid) {
      value = value ? value : "";
      if (uuid && this.changes[uuid] === undefined) return false;
      return uuid && this.changes[uuid] !== value;
    },
    storeChange(value, uuid, init = false) {
      value = value ? value : "";
      if (this.changes[uuid] === undefined) this.changes[uuid] = value;
      else if (value === this.changes[uuid] && !init) {
        delete this.changes[uuid];
        this.changesFound = Object.keys(this.changes).length > 0;
      } else if (!init) {
        this.changesFound = Object.keys(this.changes).length > 0;
      }
    },
    async triggerNewSave() {
      await this.$store.dispatch("game/saveUserGame", this.currentGame);
      this.currentGame = this.getGame;
      this.gameLoaded = true;
      this.changes = {};
      this.changesFound = false;
      this.$router.replace({
        name: "EditGame",
        params: { id: this.currentGame.id }
      });
      if (!config.debug) {
        this.$ga.event({
          eventCategory: "NewGame",
          eventAction: "new-save"
        });
      }
    },
    async triggerEditSave() {
      await this.$store.dispatch("game/saveUserGame", this.currentGame);
      this.currentGame = this.getGame;
      this.gameLoaded = true;
      this.changes = {};
      this.changesFound = false;
      if (!config.debug) {
        this.$ga.event({
          eventCategory: "NewGame",
          eventAction: "edit-save"
        });
      }
    },
    async triggerTestGame() {
      await this.triggerEditSave();
      this.$router.replace({
        name: "CharacterPicker",
        params: { game: this.currentGame.id }
      });
    },
    async triggerDeleteUserGame() {
      if (
        confirm(
          "Are you sure you want to delete this game? Data can not be restored"
        )
      ) {
        let answer = await this.$store.dispatch(
          "game/deleteUserGame",
          this.currentGame.id
        );
        if (answer && answer.deleted) {
          this.$router.replace({ name: "GameSelection" });
        }
      }
    },
    addNewCharRow(tIndex, cIndex) {
      this.currentGame.tabs[tIndex].characters.splice(
        cIndex + 1,
        0,
        blankCharacterState()
      );
      this.changesFound = true;
      this.changes[uuid()] = "added";
    },
    removeNewCharRow(tIndex, cIndex) {
      let charData = this.currentGame.tabs[tIndex].characters[cIndex];
      if (
        charData.name ||
        charData.container ||
        charData.type ||
        charData.image
      ) {
        let displayData = [];
        if (charData.name) displayData.push(charData.name);
        if (charData.container) displayData.push(charData.container);
        if (charData.type) displayData.push(charData.type);
        if (charData.image) displayData.push(charData.image);
        if (
          confirm(
            "Are you sure you want to remove the row with data? (" +
              displayData.join(", ") +
              ")"
          )
        ) {
          this.currentGame.tabs[tIndex].characters.splice(cIndex, 1);
          this.changesFound = true;
          this.changes[uuid()] = "removed";
        }
      } else {
        this.currentGame.tabs[tIndex].characters.splice(cIndex, 1);
        this.changesFound = true;
        this.changes[uuid()] = "removed";
      }
      if (this.currentGame.tabs[tIndex].characters.length === 0) {
        this.currentGame.tabs[tIndex].characters.push(blankCharacterState());
        this.changesFound = true;
        this.changes[uuid()] = "removed";
      }
    },
    moveUpCharRow(tIndex, cIndex) {
      if (cIndex > 0) {
        if (
          !this.changes[
            this.currentGame.tabs[tIndex].characters[cIndex].uuid.join("-")
          ]
        )
          this.storeChange(
            cIndex,
            this.currentGame.tabs[tIndex].characters[cIndex].uuid.join("-")
          );

        this.currentGame.tabs[tIndex].characters = this.array_move(
          this.currentGame.tabs[tIndex].characters,
          cIndex,
          cIndex - 1
        );
        this.storeChange(
          cIndex - 1,
          this.currentGame.tabs[tIndex].characters[cIndex - 1].uuid.join("-")
        );
      }
    },
    moveDownCharRow(tIndex, cIndex) {
      if (cIndex < this.currentGame.tabs[tIndex].characters.length - 1) {
        if (
          !this.changes[
            this.currentGame.tabs[tIndex].characters[cIndex].uuid.join("-")
          ]
        )
          this.storeChange(
            cIndex,
            this.currentGame.tabs[tIndex].characters[cIndex].uuid.join("-")
          );

        this.currentGame.tabs[tIndex].characters = this.array_move(
          this.currentGame.tabs[tIndex].characters,
          cIndex,
          cIndex + 1
        );
        this.storeChange(
          cIndex + 1,
          this.currentGame.tabs[tIndex].characters[cIndex + 1].uuid.join("-")
        );
      }
    },
    array_move(arr, old_index, new_index) {
      while (old_index < 0) {
        old_index += arr.length;
      }
      while (new_index < 0) {
        new_index += arr.length;
      }
      if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
          arr.push(undefined);
        }
      }
      arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
      return arr; // for testing purposes
    },
    /*overviewChanged(id) {
                console.log("trigger");
                this.changesFound = true;
                this.changes[id] = "overview";
            },*/
    addCharBack(tIndex, cIndex) {
      let char = JSON.parse(
        JSON.stringify(this.mainGameDiff.tabs[tIndex].characters[cIndex])
      );
      let useIndex =
        this.currentGame.tabs.length > tIndex
          ? tIndex
          : this.currentGame.tabs.length - 1;
      char.uuid = [uuid(), uuid(), uuid(), uuid(), uuid()];
      char.index = this.currentGame.tabs[useIndex].characters.length;
      this.currentGame.tabs[useIndex].characters.push(char);

      this.changesFound = true;
      this.changes[uuid()] = "newchar";
    }
  },
  mounted() {
    let self = this;
    let waitOnUserLoad = async index => {
      if (!self.userGames && index < 10) {
        setTimeout(() => {
          console.log("WAIT");
          return waitOnUserLoad(index + 1);
        }, 50);
      } else {
        if (!this.userLoggedIn) {
          this.$router.replace({ name: "GameSelection" });
        }
        let idSplit = window.location.href.split("/");
        await self.$store.dispatch(
          "game/downloadGame",
          idSplit[idSplit.length - 1]
        );
        self.currentGame = self.getGame;
        if (self.currentGame && self.currentGame.background) {
          if (
            self.currentGame &&
            self.currentGame.background.thumbnail &&
            !self.currentGame.background.thumbnail.startsWith("http")
          )
            self.currentGame.background.thumbnail =
              config.backendServer +
              "/" +
              self.currentGame.background.thumbnail;
          if (
            self.currentGame &&
            self.currentGame.background.url &&
            !self.currentGame.background.url.startsWith("http")
          )
            self.currentGame.background.url =
              config.backendServer + "/" + self.currentGame.background.url;
          self.openOverview = false;
        } else self.currentGame = blankState();
        this.biggerImage =
          this.currentGame.settings.contentContainer &&
          this.currentGame.settings.contentContainer === "bigger"
            ? true
            : false;
        self.gameLoaded = true;

        let mainGameType = idSplit[idSplit.length - 1].split("---");
        if (mainGameType.length > 1) {
          mainGameType = mainGameType[1];
          let mainGameData = await self.$store.dispatch(
            "game/downloadMainGameData",
            mainGameType
          );
          this.mainGameDiff = mainGameData;
        }
      }
    };
    waitOnUserLoad(0);
    //(this.userLoggedIn) ? waitOnUserLoad(0) : waitOnUserLoad(10);
  }
};
</script>

<style scoped lang="less">
.game-setup {
  padding-top: 50px;
  padding-bottom: 100px;
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
  .overview {
    max-width: 400px;
    text-align: left;
    display: inline-block;
    transition: max-height 1s;
    max-height: 2000px;
    overflow: hidden;
    &.closed {
      max-height: 0;
    }
    .input-container {
      display: block;
      margin: 20px 0;
      .changed {
        background: #daff83;
      }
      &.checkbox {
        input,
        span {
          display: inline-block;
        }
      }
      label {
        display: block;
      }
      input {
        display: block;
        &.changed {
          background: #daff83;
        }
      }
      input[type="checkbox"] {
      }
      input[type="text"] {
        width: 99%;
      }
      a {
        color: #f76331;
      }
    }
  }
  .open-overview {
  }
  .required {
    color: red;
  }

  .store-actions {
    margin-bottom: 50px;
    .button-wrapper {
      .button-container {
        display: inline-block;
        margin: 5px;
      }
    }
  }

  table {
    width: 90%;
    display: inline-table;
    border: 1px solid black;
    border-radius: 3px;
    border-collapse: collapse;
    background: #ffffff;
    .remove {
      width: 80px;
      text-align: center;
    }
    .checked-remove {
      td {
        background: grey;
      }
    }
    th {
      background: #222222;
      color: #ffffff;
      padding: 6px 0;
      text-align: left;
      padding-left: 5px;
      &:first-child {
        padding-left: 10px;
      }
    }
    td {
      text-align: center;
      border-bottom: 1px solid #222;
      padding-left: 5px;
      &.name {
        text-transform: uppercase;
      }
      &.changed {
        background: #daff83;
        border-left: 1px solid #222;
        border-right: 1px solid #222;
      }
      input {
        background: transparent;
        border: 0;
        width: 100%;
        &:focus {
          background: #fdffb9;
        }
        &:hover {
          background: #fdffb9;
          cursor: text;
        }
      }
    }
    .actions {
      width: 150px;
      text-align: center;
      button {
        padding: 4px 2px 0 2px;
        background: transparent;
        border: 1px solid #222;
        border-radius: 4px;
        cursor: pointer;
        margin: 2px;
        transition: 0.5s background;
        &:hover {
          background: #f76331;
        }
        img {
          width: 20px;
          height: 20px;
        }
      }
    }
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

  .missing-chars {
    margin-top: 100px;
    .missing-chars-button {
    }
    .missing-chars-container {
      max-height: 0px;
      overflow: auto;
      transition: 1s opacity;
      opacity: 0;
      &.active {
        opacity: 1;
        max-height: none;
      }
    }
  }
}
</style>
