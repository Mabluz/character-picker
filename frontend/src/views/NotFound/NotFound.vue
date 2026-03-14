<template>
  <div>
    <page-tabs :currentPage="'404 Not Found'"></page-tabs>
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for does not exist.</p>
    <div>
      <router-link :to="'/'">Take me back to the main page</router-link>
    </div>
  </div>
</template>

<script>
import PageTabs from "../PageTabs/PageTabs";
export default {
  name: "NotFound",
  components: { PageTabs }
};
</script>
