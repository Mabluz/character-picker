<template>
  <div class="admin-page">
    <div class="admin-header">
      <router-link to="/" class="back-link">← Back</router-link>
      <h1>Admin Panel</h1>
    </div>
    <nav class="admin-nav">
      <router-link to="/admin" exact class="admin-nav__link">Users</router-link>
      <router-link to="/admin/emails" class="admin-nav__link"
        >Email log</router-link
      >
      <router-link to="/admin/games" class="admin-nav__link">Games</router-link>
    </nav>

    <div v-if="!isAdmin" class="no-access">
      <p>Access denied. You need admin privileges to view this page.</p>
      <router-link to="/">Go home</router-link>
    </div>

    <div v-else class="games-layout">
      <!-- Left panel: list -->
      <div class="games-list">
        <div class="list-toolbar">
          <div class="type-toggle">
            <button
              class="toggle-btn"
              :class="{ active: gameType === 'user' }"
              @click="switchType('user')"
            >
              User games <span class="count">{{ userGames.length }}</span>
            </button>
            <button
              class="toggle-btn"
              :class="{ active: gameType === 'main' }"
              @click="switchType('main')"
            >
              Pre-set games <span class="count">{{ mainGames.length }}</span>
            </button>
          </div>
          <input
            class="search"
            type="text"
            placeholder="Search..."
            v-model="search"
          />
        </div>

        <div class="list-body">
          <div v-if="loading" class="state-msg">Loading...</div>
          <div v-else-if="error" class="error-box">{{ error }}</div>
          <div v-else-if="filteredGames.length === 0" class="state-msg">
            No games found.
          </div>

          <div
            v-for="game in filteredGames"
            :key="game.id"
            class="game-item"
            :class="{
              selected: selectedGame && selectedGame._key === gameKey(game)
            }"
            @click="select(game)"
          >
            <div class="game-item__title">{{ gameTitle(game) }}</div>
            <div class="game-item__meta">
              <span v-if="gameType === 'user'" class="game-item__owner">{{
                game.owner_email
              }}</span>
              <span class="game-item__id">{{ gameId(game) }}</span>
            </div>
            <div class="game-item__date">{{ formatDate(game.updated_at) }}</div>
          </div>
        </div>
      </div>

      <!-- Right panel: JSON viewer -->
      <div class="json-panel">
        <div v-if="!selectedGame" class="json-empty">
          <p>Select a game to view its JSON structure</p>
        </div>
        <div v-else class="json-content">
          <div class="json-header">
            <div>
              <div class="json-title">{{ gameTitle(selectedGame._raw) }}</div>
              <div class="json-subtitle">{{ gameId(selectedGame._raw) }}</div>
            </div>
            <div class="json-actions">
              <button class="btn btn--copy" @click="copyJson">
                {{ copied ? "Copied!" : "Copy JSON" }}
              </button>
              <button class="btn btn--download" @click="downloadJson">
                Download
              </button>
            </div>
          </div>

          <div class="json-stats">
            <span v-if="gameType === 'user'"
              >Owner: {{ selectedGame._raw.owner_email }}</span
            >
            <span>Updated: {{ formatDate(selectedGame._raw.updated_at) }}</span>
            <span v-if="selectedGame._data.characters">
              {{ selectedGame._data.characters.length }} characters
            </span>
            <span v-if="selectedGame._data.tabs">
              {{ Object.keys(selectedGame._data.tabs).length }} tabs
            </span>
          </div>

          <!-- Section tabs -->
          <div class="section-tabs">
            <button
              v-for="section in availableSections"
              :key="section.key"
              class="section-tab"
              :class="{ active: activeSection === section.key }"
              @click="activeSection = section.key"
            >
              {{ section.label }}
            </button>
          </div>

          <pre class="json-pre"><code>{{ formattedSection }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "AdminGames",
  data() {
    return {
      gameType: "user",
      userGames: [],
      mainGames: [],
      loading: false,
      error: null,
      search: "",
      selectedGame: null,
      activeSection: "full",
      copied: false
    };
  },
  computed: {
    ...mapGetters("user", ["isAdmin"]),
    currentGames() {
      return this.gameType === "user" ? this.userGames : this.mainGames;
    },
    filteredGames() {
      if (!this.search) return this.currentGames;
      const q = this.search.toLowerCase();
      return this.currentGames.filter(g => {
        const title = this.gameTitle(g).toLowerCase();
        const id = this.gameId(g).toLowerCase();
        const owner = (g.owner_email || "").toLowerCase();
        return title.includes(q) || id.includes(q) || owner.includes(q);
      });
    },
    availableSections() {
      if (!this.selectedGame) return [];
      const d = this.selectedGame._data;
      const sections = [{ key: "full", label: "Full JSON" }];
      if (d.characters && d.characters.length)
        sections.push({
          key: "characters",
          label: `Characters (${d.characters.length})`
        });
      if (d.tabs) sections.push({ key: "tabs", label: "Tabs" });
      if (d.background)
        sections.push({ key: "background", label: "Background" });
      if (d.settings) sections.push({ key: "settings", label: "Settings" });
      if (d.affiliate) sections.push({ key: "affiliate", label: "Affiliate" });
      return sections;
    },
    formattedSection() {
      if (!this.selectedGame) return "";
      const d = this.selectedGame._data;
      if (this.activeSection === "full") return JSON.stringify(d, null, 2);
      const val = d[this.activeSection];
      return JSON.stringify(val, null, 2);
    }
  },
  watch: {
    isAdmin(val) {
      if (val && !this.loading && this.userGames.length === 0) {
        this.load();
      }
    }
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = null;
      try {
        const [userGames, mainGames] = await Promise.all([
          this.$store.dispatch("user/adminGetUserGames"),
          this.$store.dispatch("user/adminGetMainGames")
        ]);
        this.userGames = userGames || [];
        this.mainGames = mainGames || [];
      } catch (e) {
        this.error =
          "Failed to load games: " +
          (e.response && e.response.data && e.response.data.error
            ? e.response.data.error
            : e.message);
      } finally {
        this.loading = false;
      }
    },
    async switchType(type) {
      this.gameType = type;
      this.selectedGame = null;
      this.search = "";
    },
    select(game) {
      const data = this.gameType === "user" ? game.game_data : game;
      const key = this.gameKey(game);
      // Reset section to full (or keep if same game re-selected)
      if (!this.selectedGame || this.selectedGame._key !== key) {
        this.activeSection = "full";
      }
      this.selectedGame = { _key: key, _raw: game, _data: data };
    },
    gameKey(game) {
      return this.gameType === "user" ? game.id : game.id;
    },
    gameTitle(game) {
      if (this.gameType === "user") {
        const d = game.game_data || game;
        return d.background && d.background.title
          ? d.background.title
          : game.id || "Untitled";
      }
      return game.background && game.background.title
        ? game.background.title
        : game.title || game.id || "Untitled";
    },
    gameId(game) {
      return game.id || "";
    },
    formatDate(dateStr) {
      if (!dateStr) return "—";
      return new Date(dateStr).toLocaleString();
    },
    copyJson() {
      navigator.clipboard.writeText(this.formattedSection).then(() => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      });
    },
    downloadJson() {
      const d = this.selectedGame._data;
      const id = (
        d.id ||
        this.gameId(this.selectedGame._raw) ||
        "game"
      ).replace(/[^a-z0-9-_]/gi, "_");
      const blob = new Blob([this.formattedSection], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        id +
        (this.activeSection !== "full" ? `-${this.activeSection}` : "") +
        ".json";
      a.click();
      URL.revokeObjectURL(url);
    }
  },
  async created() {
    if (this.isAdmin) {
      await this.load();
    }
  }
};
</script>

<style scoped lang="less">
@accent: #f76331;
@border: #ddd;

.admin-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px 60px;
  text-align: left;
}

.admin-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  h1 {
    margin: 0;
    display: inline;
    font-size: 28px;
  }
}

.back-link {
  color: @accent;
  text-decoration: none;
  font-size: 16px;
  &:hover {
    text-decoration: underline;
  }
}

.admin-nav {
  display: flex;
  gap: 4px;
  border-bottom: 2px solid @border;
  margin-bottom: 28px;

  &__link {
    padding: 8px 18px;
    text-decoration: none;
    color: #555;
    font-size: 15px;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
    transition: color 0.15s, border-color 0.15s;
    &:hover {
      color: @accent;
    }
    &.router-link-active {
      color: @accent;
      border-bottom-color: @accent;
      font-weight: 600;
    }
  }
}

.no-access {
  text-align: center;
  padding: 80px 20px;
  font-size: 18px;
  a {
    color: @accent;
  }
}

/* Two-panel layout */
.games-layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 220px);
  min-height: 500px;
}

/* Left panel */
.games-list {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid @border;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.list-toolbar {
  padding: 12px;
  border-bottom: 1px solid @border;
  background: #fafafa;
}

.type-toggle {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
}

.toggle-btn {
  flex: 1;
  padding: 6px 8px;
  border: 2px solid @border;
  border-radius: 6px;
  background: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  color: #555;
  transition: all 0.15s;

  &.active {
    background: @accent;
    border-color: @accent;
    color: white;
  }
  &:not(.active):hover {
    border-color: @accent;
    color: @accent;
  }
}

.count {
  display: inline-block;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 10px;
  padding: 0 5px;
  font-size: 11px;
  margin-left: 3px;
  .active & {
    background: rgba(255, 255, 255, 0.25);
  }
}

.search {
  width: 100%;
  box-sizing: border-box;
  padding: 7px 10px;
  border: 1px solid @border;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  &:focus {
    border-color: @accent;
  }
}

.game-item {
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.12s;
  overflow: hidden;

  &:hover {
    background: #fdf4f0;
  }
  &.selected {
    background: #fff0ea;
    border-left: 3px solid @accent;
  }
  &:last-child {
    border-bottom: none;
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__meta {
    display: flex;
    gap: 8px;
    margin-top: 2px;
    align-items: center;
  }

  &__owner {
    font-size: 11px;
    color: #888;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 160px;
  }

  &__id {
    font-size: 10px;
    color: #aaa;
    font-family: monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__date {
    font-size: 11px;
    color: #bbb;
    margin-top: 3px;
  }
}

.list-body {
  flex: 1;
  overflow-y: auto;
}

/* Right panel */
.json-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid @border;
  border-radius: 8px;
  overflow: hidden;
  background: white;
  min-width: 0;
}

.json-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 15px;
}

.json-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 18px;
  border-bottom: 1px solid @border;
  background: #fafafa;
  gap: 12px;
  flex-shrink: 0;
}

.json-title {
  font-size: 16px;
  font-weight: 700;
  color: #222;
}

.json-subtitle {
  font-size: 11px;
  color: #888;
  font-family: monospace;
  margin-top: 2px;
}

.json-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn {
  padding: 7px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;

  &--copy {
    background: #e2e8f0;
    color: #4a5568;
    &:hover {
      background: #cbd5e0;
    }
  }
  &--download {
    background: @accent;
    color: white;
    &:hover {
      opacity: 0.85;
    }
  }
}

.json-stats {
  display: flex;
  gap: 16px;
  padding: 8px 18px;
  font-size: 12px;
  color: #666;
  background: #f9f9f9;
  border-bottom: 1px solid @border;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.section-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid @border;
  background: white;
  flex-shrink: 0;
  overflow-x: auto;
}

.section-tab {
  padding: 8px 16px;
  border: none;
  background: none;
  font-size: 13px;
  font-family: inherit;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 3px solid transparent;
  transition: all 0.15s;

  &:hover {
    color: @accent;
  }
  &.active {
    color: @accent;
    border-bottom-color: @accent;
    font-weight: 600;
  }
}

.json-pre {
  flex: 1;
  margin: 0;
  padding: 16px 18px;
  overflow: auto;
  font-size: 12.5px;
  line-height: 1.6;
  font-family: "SFMono-Regular", "Consolas", "Liberation Mono", monospace;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 0 0 8px 8px;

  code {
    font-family: inherit;
    white-space: pre;
  }
}

.state-msg {
  padding: 30px;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.error-box {
  margin: 12px;
  background: #fff5f5;
  border: 1px solid #fc8181;
  border-radius: 6px;
  padding: 10px 14px;
  color: #c53030;
  font-size: 13px;
}

@media (max-width: 768px) {
  .games-layout {
    flex-direction: column;
    height: auto;
  }
  .games-list {
    width: 100%;
    max-height: 300px;
  }
  .json-panel {
    min-height: 400px;
  }
}
</style>
