<template>
  <div class="tabs">
    <ul>
      <li><a href="/">Games</a></li>
      <li v-for="li in list">
        <router-link :to="li.url">{{ li.text }}</router-link>
      </li>
      <li>{{ getCurrentPage }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "PageTabs",
  props: ["list", "currentPage"],
  computed: {
    getCurrentPage() {
      if (this.currentPage) return this.currentPage;
      return "Current page";
    }
  }
};
</script>

<style scoped lang="less">
.tabs {
  text-align: left;
  li {
    display: inline-block;
    list-style: none;
    margin-right: 30px;
    &:after {
      content: " >";
      color: #f76331;
    }
    &:last-child {
      font-weight: bold;
      &:after {
        content: "";
        color: #000;
      }
    }
    a {
      color: #f76331;
    }
  }
}
</style>
