<template>
  <div>
    <form
      :id="id"
      action="https://www.paypal.com/cgi-bin/webscr"
      method="post"
      target="_top"
    >
      <input type="hidden" name="cmd" value="_s-xclick" />
      <input type="hidden" name="hosted_button_id" value="WQVPEVPRDLFYG" />
      <!--<img alt="" border="0" src="https://www.paypal.com/en_NO/i/scr/pixel.gif" width="1" height="1" />-->
    </form>
    <char-button :href="'javascript:'" @click="submit" :color="getColor"
      >Donate (PayPal)</char-button
    >
    <div v-if="showInfo" class="help">
      Servers are not free... Help me keeping this site alive.
      <router-link :to="'/donate/'">Read more</router-link>.
    </div>
  </div>
</template>

<script>
import CharButton from "../CharButton";
export default {
  name: "DonateButton",
  props: ["color", "displayinfo"],
  components: { CharButton },
  data() {
    return {
      id: "donateform"
    };
  },
  computed: {
    showInfo() {
      if (this.displayinfo !== undefined) return this.displayinfo;
      return true;
    },
    getColor() {
      if (this.color) return this.color;
      return "white";
    }
  },
  methods: {
    submit() {
      let form = document.getElementById(this.id);
      form.submit();
    }
  },
  created() {
    this.id = "donateform_" + parseInt(Math.random() * 1000000);
  }
};
</script>

<style scoped lang="less">
.help {
  margin-top: 10px;
}
form {
  height: 0;
}
</style>
