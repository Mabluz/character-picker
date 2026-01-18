<template>
  <div class="wrapper" :class="{ mobile: isMobile }">
    <ul class="tabs" data-tabgroup="first-tab-group">
      <li v-for="(tab, index) in getTabs">
        <a @click="clickTab(index)" :class="{ active: index === activeTab }">
          <span v-if="isEditable">
            <input type="text" v-model="tab.title" />
            <span class="action remove-tab" @click="clickRemoveTab(index)"
              >-</span
            >
          </span>
          <span v-else>{{ tab.title }}</span>
        </a>
      </li>
      <li v-if="isEditable">
        <a @click="clickNewTab">
          <span class="action">+</span>
        </a>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "CharTabs",
  props: ["tabs", "setActiveTab", "editable", "isMobile"],
  data() {
    return {
      activeTab: 0,
      removingTab: undefined
    };
  },
  computed: {
    isEditable() {
      return this.editable ? this.editable : false;
    },
    getActiveTab() {
      if (!this.activeTab) return 0;
      return this.activeTab;
    },
    getTabs() {
      if (!this.tabs) return [];
      return this.tabs;
    }
  },
  methods: {
    clickNewTab() {
      this.activeTab = this.getTabs.length;
      this.$emit("newTab");
    },
    clickRemoveTab(index) {
      this.removingTab = index;
      this.$emit("removeTab", index);
    },
    clickTab(index) {
      if (this.removingTab && this.removingTab === index) {
        this.activeTab = 0;
        return (this.removingTab = undefined);
      }
      this.activeTab = index;
      this.$emit("clicked", this.activeTab);
    }
  },
  created() {
    if (this.setActiveTab) this.activeTab = this.setActiveTab;
  }
};
</script>

<style scoped lang="less">
* {
  margin: 0;
  padding: 0;
}

.mobile {
  .wrapper {
    width: 100%;
  }
}

.wrapper {
  width: 90%;
  text-align: center;
  display: inline-block;
  font-family: sans-serif;
  color: #222222;
  font-size: 14px;
  line-height: 24px;
  margin-bottom: -4px;
  padding: 0;
}

.tabs {
  li {
    list-style: none;
    float: left;
    input {
      background: transparent;
      border: 0;
      color: white;
      width: 60%;
      display: inline-block;
      &:focus {
        background: #fdffb9;
        color: black;
      }
    }
    .action {
      font-size: 26px;
      line-height: 20px;
      padding: 5px;
      width: 20%;
      display: inline-block;
      &:hover {
        font-weight: bold;
      }
    }
    .remove-tab {
    }
  }
  a {
    cursor: pointer;
    display: block;
    text-align: center;
    text-decoration: none;
    position: relative;
    text-transform: uppercase;
    color: #fff;
    height: 47px;
    padding: 0 15px;
    line-height: 50px;
    border-top: 1px solid #222;
    border-left: 1px solid #222;
    border-right: 1px solid #222;
    border-radius: 12px 12px 0 0;
    margin-right: 2px;
    background: #222;
    transition: 0.5s background;

    &:hover {
      background: #393835;
      color: #fff;
    }

    &.active {
      font-weight: bold;
      background: #f76331;
      color: #fff;
      &:hover {
        background: #f76331;
      }
    }
  }
}
</style>
