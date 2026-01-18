<template>
  <div>
    <page-tabs :currentPage="'Donate thank you'"></page-tabs>
    <h1>Thank you for your donation!</h1>
    <p>
      Rest assured the money will be well spent on keeping this site running.
    </p>

    <div>
      <router-link :to="'/'">Take me back to the main page</router-link>
    </div>

    <img src="./minions1.jpg" />
  </div>
</template>

<script>
import PageTabs from "../PageTabs/PageTabs";
export default {
  name: "DonateThanks",
  components: { PageTabs }
};
</script>

<style scoped lang="less">
a.router-link-active {
  color: #222;
}

img {
  margin-top: 200px;
}
</style>
