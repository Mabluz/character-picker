<template>
  <div>
    <h1>Password reset</h1>
    <div class="error" v-if="error">
      <h2>Error</h2>
      <p>{{ error }}</p>
      <p>Please try the password reset again.</p>
    </div>
    <div class="success" v-if="success">
      <h2>Success</h2>
      <p>{{ success }}</p>
      <p>You are now ready for starting using your new password!</p>
    </div>
    <router-link :to="'/'">
      Go back to frontpage
    </router-link>
  </div>
</template>

<script>
export default {
  name: "PasswordReset",
  data() {
    return {
      error: undefined,
      success: undefined
    };
  },
  async created() {
    let email = this.$route.query.e;
    let token = this.$route.query.t;
    let response = await this.$store.dispatch("user/acceptPasswordReset", {
      email: email,
      token: token
    });
    if (response.error) this.error = response.error;
    if (response.answer) this.success = response.answer;
  }
};
</script>

<style scoped lang="less">
.error {
  p {
    font-size: 20px;
    color: #222;
  }
  h2 {
    color: #b40000;
  }
}
.success {
  p {
    font-size: 20px;
  }
  h2 {
    color: #48b42f;
  }
}
.router-link,
.router-link-active {
  font-size: 20px;
  color: #f76331;
  margin-top: 50px;
  margin-bottom: 100px;
  display: block;
}
</style>
