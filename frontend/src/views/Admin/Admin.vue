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

    <div v-else>
      <div class="toolbar">
        <button
          class="btn btn--secondary"
          @click="loadUsers"
          :disabled="loading"
        >
          {{ loading ? "Loading..." : "Refresh" }}
        </button>
        <button
          class="btn btn--download"
          @click="downloadBackup"
          :disabled="downloading"
        >
          {{ downloading ? "Preparing..." : "Download backup" }}
        </button>
      </div>

      <div v-if="error" class="error-msg">{{ error }}</div>

      <div class="stats" v-if="users.length">
        <span>{{ users.length }} users</span>
        <span>{{ totalGames }} games total</span>
        <span>{{ adminCount }} admins</span>
        <span class="stat--blocked" v-if="blockedCount"
          >{{ blockedCount }} blocked</span
        >
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Admin</th>
              <th>Blocked</th>
              <th>Games</th>
              <th>Last login</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="user in sortedUsers"
              :key="user.userId"
              :class="{ 'row-blocked': user.isBlocked }"
            >
              <td class="email">
                {{ user.email }}
                <span v-if="user.isBlocked" class="blocked-badge">blocked</span>
              </td>
              <td class="toggle-cell">
                <label class="toggle">
                  <input
                    type="checkbox"
                    :checked="user.isAdmin"
                    @change="toggleAdmin(user, $event)"
                    :disabled="togglingId === user.userId || user.isBlocked"
                  />
                  <span class="slider"></span>
                </label>
              </td>
              <td class="toggle-cell">
                <label class="toggle toggle--danger">
                  <input
                    type="checkbox"
                    :checked="user.isBlocked"
                    @change="toggleBlocked(user, $event)"
                    :disabled="blockingId === user.userId"
                  />
                  <span class="slider"></span>
                </label>
              </td>
              <td>{{ user.data ? user.data.length : 0 }}</td>
              <td class="date">{{ formatDate(user.tokenTime) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "AdminPage",
  data() {
    return {
      users: [],
      loading: false,
      downloading: false,
      togglingId: null,
      blockingId: null,
      error: null
    };
  },
  watch: {
    isAdmin(val) {
      if (val && this.users.length === 0 && !this.loading) {
        this.loadUsers();
      }
    }
  },
  computed: {
    ...mapGetters("user", ["isAdmin", "userLoggedIn"]),
    sortedUsers() {
      return [...this.users].sort((a, b) => {
        if (a.isBlocked !== b.isBlocked) return a.isBlocked ? 1 : -1;
        if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
        return a.email.localeCompare(b.email);
      });
    },
    totalGames() {
      return this.users.reduce(
        (sum, u) => sum + (u.data ? u.data.length : 0),
        0
      );
    },
    adminCount() {
      return this.users.filter(u => u.isAdmin).length;
    },
    blockedCount() {
      return this.users.filter(u => u.isBlocked).length;
    }
  },
  methods: {
    async loadUsers() {
      this.loading = true;
      this.error = null;
      try {
        this.users = await this.$store.dispatch("user/adminGetUsers");
      } catch (e) {
        this.error =
          "Failed to load users. " +
          (e.response && e.response.data && e.response.data.error
            ? e.response.data.error
            : e.message);
      } finally {
        this.loading = false;
      }
    },
    async toggleAdmin(user, event) {
      const newValue = event.target.checked;
      this.togglingId = user.userId;
      try {
        await this.$store.dispatch("user/adminSetAdmin", {
          userId: user.userId,
          isAdmin: newValue
        });
        user.isAdmin = newValue;
      } catch (e) {
        event.target.checked = !newValue;
        this.error = "Failed to update admin status.";
      } finally {
        this.togglingId = null;
      }
    },
    async toggleBlocked(user, event) {
      const newValue = event.target.checked;
      this.blockingId = user.userId;
      try {
        await this.$store.dispatch("user/adminSetBlocked", {
          userId: user.userId,
          isBlocked: newValue
        });
        user.isBlocked = newValue;
        if (newValue && user.isAdmin) user.isAdmin = false;
      } catch (e) {
        event.target.checked = !newValue;
        this.error = "Failed to update blocked status.";
      } finally {
        this.blockingId = null;
      }
    },
    async downloadBackup() {
      this.downloading = true;
      this.error = null;
      try {
        const data = await this.$store.dispatch("user/adminGetBackup");
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          "backup-" + new Date().toISOString().slice(0, 10) + ".json";
        a.click();
        URL.revokeObjectURL(url);
      } catch (e) {
        this.error = "Failed to download backup.";
      } finally {
        this.downloading = false;
      }
    },
    formatDate(tokenTime) {
      if (!tokenTime) return "Never";
      return new Date(tokenTime).toLocaleString();
    }
  },
  async created() {
    if (this.isAdmin) {
      await this.loadUsers();
    }
  }
};
</script>

<style scoped lang="less">
@accent: #f76331;
@border: #ddd;

.admin-page {
  max-width: 1100px;
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

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &--secondary {
    background: #eee;
    color: #333;
    &:hover:not(:disabled) {
      background: #ddd;
    }
  }

  &--download {
    background: @accent;
    color: white;
    &:hover:not(:disabled) {
      opacity: 0.85;
    }
  }
}

.error-msg {
  background: #ffeaea;
  border: 1px solid #f99;
  color: #c00;
  padding: 10px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 14px;
}

.stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;

  span {
    background: #f5f5f5;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid @border;
  }
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid @border;
  border-radius: 8px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    background: #f5f5f5;
    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 600;
      color: #444;
      border-bottom: 2px solid @border;
    }
  }

  tbody tr {
    border-bottom: 1px solid @border;
    transition: background 0.15s;
    &:last-child {
      border-bottom: none;
    }
    &:hover {
      background: #fafafa;
    }

    td {
      padding: 11px 16px;
      vertical-align: middle;
    }
  }

  .email {
    font-family: monospace;
    font-size: 13px;
  }
  .date {
    color: #888;
    font-size: 13px;
  }
  .toggle-cell {
    width: 80px;
  }
  .row-blocked td {
    background: #fff5f5;
    color: #999;
  }
  .row-blocked:hover td {
    background: #ffe8e8;
  }
}

.stat--blocked {
  background: #fed7d7;
  color: #9b2c2c;
  border-color: #fc8181;
}

.blocked-badge {
  display: inline-block;
  background: #e53e3e;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  margin-left: 6px;
  vertical-align: middle;
  font-family: sans-serif;
  letter-spacing: 0.03em;
}

// Toggle switch
.toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    inset: 0;
    background: #ccc;
    border-radius: 24px;
    transition: background 0.2s;

    &::before {
      content: "";
      position: absolute;
      width: 18px;
      height: 18px;
      left: 3px;
      top: 3px;
      background: white;
      border-radius: 50%;
      transition: transform 0.2s;
    }
  }

  input:checked + .slider {
    background: @accent;
    &::before {
      transform: translateX(20px);
    }
  }

  &--danger input:checked + .slider {
    background: #e53e3e;
  }

  input:disabled + .slider {
    opacity: 0.5;
    cursor: default;
  }
}
</style>
