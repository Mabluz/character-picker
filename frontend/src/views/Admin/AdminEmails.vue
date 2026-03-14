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
      <!-- Header row -->
      <div class="emails-header">
        <div>
          <p class="emails-sub">Emails sent via Resend</p>
        </div>
        <div class="header-actions">
          <button
            v-if="alertCount > 0"
            class="btn btn--clear"
            @click="clearAlerts"
            :disabled="clearing"
          >
            {{ clearing ? "Clearing..." : `Mark ${alertCount} alerts as seen` }}
          </button>
          <button
            class="btn btn--secondary"
            @click="loadAll"
            :disabled="loading"
          >
            {{ loading ? "Loading..." : "Refresh" }}
          </button>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="summary-cards">
        <div class="summary-card delivered">
          <div class="summary-number">{{ countByStatus("delivered") }}</div>
          <div class="summary-label">Delivered</div>
        </div>
        <div class="summary-card bounced">
          <div class="summary-number">{{ countByStatus("bounced") }}</div>
          <div class="summary-label">Bounced</div>
        </div>
        <div class="summary-card complained">
          <div class="summary-number">{{ countByStatus("complained") }}</div>
          <div class="summary-label">Spam complaints</div>
        </div>
        <div class="summary-card delayed">
          <div class="summary-number">
            {{ countByStatus("delivery_delayed") }}
          </div>
          <div class="summary-label">Delayed</div>
        </div>
        <div class="summary-card failed">
          <div class="summary-number">{{ sendErrors.length }}</div>
          <div class="summary-label">Send failures</div>
        </div>
      </div>

      <!-- Alert banner -->
      <div v-if="alertCount > 0" class="alert-banner">
        <span class="alert-dot"></span>
        <strong>{{ alertCount }} new alerts</strong> since last check — rows
        marked <span class="new-tag-inline">New</span> have not been seen yet.
      </div>

      <!-- Sent emails section -->
      <div class="section-title">
        <h2>Sent emails</h2>
      </div>

      <div class="filter-bar">
        <button
          v-for="f in filters"
          :key="f.value"
          class="filter-btn"
          :class="{ active: activeFilter === f.value }"
          @click="activeFilter = f.value"
        >
          {{ f.label }}
          <span class="filter-count">{{
            f.value === "all" ? emails.length : countByStatus(f.value)
          }}</span>
        </button>
      </div>

      <div v-if="loading" class="state-msg">Loading email log...</div>
      <div v-else-if="emailsError" class="error-box">{{ emailsError }}</div>
      <div v-else-if="filteredEmails.length === 0" class="state-msg">
        <span v-if="emails.length === 0"
          >No emails found. Emails sent via Resend will appear here.</span
        >
        <span v-else>No emails with this status.</span>
      </div>

      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Subject</th>
              <th>To</th>
              <th>Status</th>
              <th>Sent</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="email in filteredEmails"
              :key="email.id"
              :class="{ 'row-new': isNewAlert(email) }"
            >
              <td class="new-cell">
                <span v-if="isNewAlert(email)" class="new-tag">New</span>
              </td>
              <td class="subject-cell">
                {{ email.subject || "(no subject)" }}
              </td>
              <td class="to-cell">{{ formatRecipients(email.to) }}</td>
              <td>
                <span
                  class="status-badge"
                  :class="statusClass(email.last_event)"
                >
                  {{ statusLabel(email.last_event) }}
                </span>
              </td>
              <td class="date-cell">{{ formatDate(email.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Load more -->
      <div v-if="hasMore && !loading" class="load-more-row">
        <button
          class="btn btn--secondary"
          @click="loadMore"
          :disabled="loadingMore"
        >
          {{ loadingMore ? "Loading..." : "Load more" }}
        </button>
      </div>

      <!-- Failed send attempts -->
      <div class="section-title" style="margin-top: 2.5rem;">
        <h2>Failed send attempts</h2>
        <p>
          Emails rejected by Resend before sending (e.g. domain not verified,
          invalid API key)
        </p>
      </div>

      <div v-if="!loading && sendErrors.length === 0" class="state-msg">
        No failed send attempts recorded.
      </div>

      <div v-else-if="sendErrors.length > 0" class="table-wrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Subject</th>
              <th>To</th>
              <th>Error</th>
              <th>Code</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="err in sendErrors"
              :key="err.id"
              class="error-row"
              :class="{ 'row-new': err.is_new }"
            >
              <td class="new-cell">
                <span v-if="err.is_new" class="new-tag">New</span>
              </td>
              <td class="subject-cell">{{ err.subject || "(no subject)" }}</td>
              <td class="to-cell">{{ err.recipient }}</td>
              <td class="error-msg-cell">{{ err.error_message }}</td>
              <td>
                <span
                  v-if="err.error_code"
                  class="status-badge status-bounced"
                  >{{ err.error_code }}</span
                >
                <span v-else class="status-badge status-unknown">—</span>
              </td>
              <td class="date-cell">{{ formatDate(err.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

const ALERT_STATUSES = new Set(["bounced", "complained", "delivery_delayed"]);
const PAGE_SIZE = 50;

export default {
  name: "AdminEmails",
  data() {
    return {
      emails: [],
      sendErrors: [],
      loading: false,
      loadingMore: false,
      hasMore: false,
      nextCursor: undefined,
      clearing: false,
      emailsError: "",
      activeFilter: "all",
      clearedAt: new Date(0),
      alertCount: 0,
      filters: [
        { value: "all", label: "All" },
        { value: "delivered", label: "Delivered" },
        { value: "sent", label: "Sent" },
        { value: "bounced", label: "Bounced" },
        { value: "complained", label: "Spam" },
        { value: "delivery_delayed", label: "Delayed" }
      ]
    };
  },
  watch: {
    isAdmin(val) {
      if (val && !this.loading && this.emails.length === 0) {
        this.loadAll();
      }
    }
  },
  computed: {
    ...mapGetters("user", ["isAdmin"]),
    filteredEmails() {
      if (this.activeFilter === "all") return this.emails;
      return this.emails.filter(e => e.last_event === this.activeFilter);
    }
  },
  methods: {
    countByStatus(status) {
      return this.emails.filter(e => e.last_event === status).length;
    },
    parseUTC(s) {
      if (!s) return new Date(0);
      if (s.endsWith("Z") || s.includes("+")) return new Date(s);
      return new Date(s.replace(" ", "T") + "Z");
    },
    isNewAlert(email) {
      return (
        ALERT_STATUSES.has(email.last_event) &&
        this.parseUTC(email.created_at) > this.clearedAt
      );
    },
    statusClass(status) {
      const map = {
        delivered: "status-delivered",
        sent: "status-sent",
        queued: "status-queued",
        bounced: "status-bounced",
        complained: "status-complained",
        delivery_delayed: "status-delayed",
        clicked: "status-clicked",
        opened: "status-opened"
      };
      return map[status] || "status-unknown";
    },
    statusLabel(status) {
      const map = {
        delivered: "Delivered",
        sent: "Sent",
        queued: "Queued",
        bounced: "Bounced",
        complained: "Spam complaint",
        delivery_delayed: "Delayed",
        clicked: "Clicked",
        opened: "Opened"
      };
      return map[status] || status;
    },
    formatRecipients(to) {
      const arr = Array.isArray(to) ? to : [to];
      if (arr.length <= 2) return arr.join(", ");
      return `${arr[0]} +${arr.length - 1} more`;
    },
    formatDate(dateStr) {
      return this.parseUTC(dateStr).toLocaleString();
    },
    async loadAll() {
      this.loading = true;
      this.nextCursor = undefined;
      this.emailsError = "";

      const [
        emailsResult,
        errorsResult,
        countResult
      ] = await Promise.allSettled([
        this.$store.dispatch("user/adminGetEmails", { limit: PAGE_SIZE }),
        this.$store.dispatch("user/adminGetEmailErrors"),
        this.$store.dispatch("user/adminGetEmailAlertCount")
      ]);

      if (emailsResult.status === "fulfilled") {
        const page =
          emailsResult.value && emailsResult.value.data
            ? emailsResult.value.data
            : emailsResult.value || [];
        this.emails = Array.isArray(page) ? page : [];
        this.hasMore =
          emailsResult.value && emailsResult.value.has_more
            ? emailsResult.value.has_more
            : false;
        this.nextCursor = this.emails.length
          ? this.emails[this.emails.length - 1].id
          : undefined;
      } else {
        this.emailsError = "Could not load email log.";
      }

      if (errorsResult.status === "fulfilled") {
        this.sendErrors = errorsResult.value || [];
      }

      if (countResult.status === "fulfilled") {
        const countData = countResult.value || {};
        this.clearedAt = new Date(countData.cleared_at || 0);
        this.alertCount = countData.count || 0;
      }

      this.loading = false;
    },
    async loadMore() {
      this.loadingMore = true;
      try {
        const result = await this.$store.dispatch("user/adminGetEmails", {
          limit: PAGE_SIZE,
          after: this.nextCursor
        });
        const page = result && result.data ? result.data : result || [];
        this.emails = [...this.emails, ...page];
        this.hasMore = result && result.has_more ? result.has_more : false;
        this.nextCursor = page.length
          ? page[page.length - 1].id
          : this.nextCursor;
      } finally {
        this.loadingMore = false;
      }
    },
    async clearAlerts() {
      this.clearing = true;
      try {
        const result = await this.$store.dispatch("user/adminClearEmailAlerts");
        this.clearedAt = new Date(
          result && result.cleared_at ? result.cleared_at : Date.now()
        );
        this.alertCount = 0;
      } catch (e) {
        console.error("Failed to clear alerts", e);
      } finally {
        this.clearing = false;
      }
    }
  },
  async created() {
    if (this.isAdmin) {
      await this.loadAll();
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

.emails-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 12px;

  .emails-sub {
    color: #666;
    margin: 0;
    font-size: 14px;
  }
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}

.btn {
  padding: 9px 18px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.2s;
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &--secondary {
    background: #e2e8f0;
    color: #4a5568;
    &:hover:not(:disabled) {
      background: #cbd5e0;
    }
  }

  &--clear {
    background: #fc4444;
    color: white;
    &:hover:not(:disabled) {
      background: #e53e3e;
    }
  }
}

/* Summary cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 20px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.summary-card {
  background: white;
  border-radius: 10px;
  padding: 18px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border-top: 4px solid transparent;

  &.delivered {
    border-color: #38a169;
  }
  &.bounced {
    border-color: #e53e3e;
  }
  &.complained {
    border-color: #dd6b20;
  }
  &.delayed {
    border-color: #d69e2e;
  }
  &.failed {
    border-color: #9b2c2c;
  }
}

.summary-number {
  font-size: 2rem;
  font-weight: 700;
  color: #2d3748;
}

.summary-label {
  font-size: 13px;
  color: #718096;
  margin-top: 4px;
}

/* Alert banner */
.alert-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #742a2a;
}

.alert-dot {
  width: 10px;
  height: 10px;
  background: #fc4444;
  border-radius: 50%;
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
    transform: scale(0.85);
  }
}

.new-tag-inline {
  display: inline-block;
  background: #fc4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
  vertical-align: middle;
}

.section-title {
  margin-bottom: 12px;
  h2 {
    font-size: 18px;
    font-weight: 700;
    color: #2d3748;
    margin: 0 0 4px;
  }
  p {
    color: #718096;
    font-size: 13px;
    margin: 0;
  }
}

/* Filter bar */
.filter-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  background: white;
  color: #4a5568;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;

  &:hover {
    border-color: @accent;
    color: @accent;
  }
  &.active {
    background: @accent;
    border-color: @accent;
    color: white;
  }
}

.filter-count {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 999px;
  padding: 1px 7px;
  font-size: 12px;
  font-weight: 700;
  .active & {
    background: rgba(255, 255, 255, 0.25);
  }
}

/* Table */
.table-wrap {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 12px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;

  thead {
    th {
      background: #f7fafc;
      padding: 11px 14px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #718096;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #e2e8f0;
      &:first-child {
        width: 48px;
        padding-right: 0;
      }
    }
  }

  tbody tr {
    border-bottom: 1px solid #f0f4f8;
    transition: background 0.12s;
    &:last-child {
      border-bottom: none;
    }
    &:hover td {
      background: #f7fafc;
    }
    &.row-new td {
      background: #fff8f8;
    }
    &.row-new:hover td {
      background: #ffefef;
    }
    &.error-row:hover td {
      background: #fff5f5;
    }

    td {
      padding: 11px 14px;
      vertical-align: middle;
      color: #2d3748;
    }
  }
}

.new-cell {
  width: 48px;
  padding-right: 0 !important;
}

.new-tag {
  display: inline-block;
  background: #fc4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 4px;
}

.subject-cell {
  font-weight: 500;
  max-width: 240px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.to-cell {
  color: #4a5568;
  font-size: 13px;
}
.error-msg-cell {
  color: #9b2c2c;
  font-size: 13px;
  max-width: 260px;
}
.date-cell {
  color: #718096;
  font-size: 13px;
  white-space: nowrap;
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.status-delivered {
  background: #c6f6d5;
  color: #276749;
}
.status-sent {
  background: #bee3f8;
  color: #2a69ac;
}
.status-queued {
  background: #e2e8f0;
  color: #4a5568;
}
.status-bounced {
  background: #fed7d7;
  color: #9b2c2c;
}
.status-complained {
  background: #feebc8;
  color: #7b341e;
}
.status-delayed {
  background: #fefcbf;
  color: #744210;
}
.status-clicked {
  background: #e9d8fd;
  color: #553c9a;
}
.status-opened {
  background: #b2f5ea;
  color: #234e52;
}
.status-unknown {
  background: #e2e8f0;
  color: #4a5568;
}

.state-msg {
  text-align: center;
  padding: 40px 20px;
  color: #718096;
  font-size: 15px;
}

.error-box {
  background: #fff5f5;
  border: 1px solid #fc8181;
  border-radius: 8px;
  padding: 12px 16px;
  color: #c53030;
  margin-bottom: 14px;
  font-size: 14px;
}

.load-more-row {
  display: flex;
  justify-content: center;
  padding: 14px 0;
}
</style>
