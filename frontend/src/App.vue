<template>
  <div id="app">
    <div class="spinner" :class="{ active: isLoading }">
      <h2>Loading...</h2>
      <div id="loading"></div>
    </div>

    <div class="install-app" v-if="showInstallUIAndroid && isAndroid">
      <!--  -->
      <div class="close" @click="installClose(cookieKey[0])">
        <img src="/close-black.png" />
      </div>
      <div class="install-text">
        Random Boardgame can be installed as an app on your Android.<br />Want
        to contine?
      </div>
      <button @click="installApp">Install</button>
    </div>
    <div class="install-app" v-if="showInstallGuide && isAndroid">
      <!--  -->
      <div class="close" @click="installClose(cookieKey[1])">
        <img src="/close-black.png" />
      </div>
      <div class="install-text">
        Random Boardgame can be installed as an app on your Android.<br />
        <a href="https://character-picker.herokuapp.com/"
          >Go to downloadable site?</a
        >
      </div>
    </div>
    <div class="install-app" v-if="showInstallUIIos && isIOS">
      <!--  -->
      <div class="close" @click="installClose(cookieKey[2])">
        <img src="/close-black.png" />
      </div>
      <div class="install-text full">
        Random Boardgame can be added as an app on your iOS.
        <br />Share->Options->Add to Homescreen<br />(<a
          href="https://www.youtube.com/watch?v=bV8xE6lOdoY"
          target="_blank"
          >Or see how on youtube</a
        >)
      </div>
    </div>

    <router-view />

    <ad-component ad-slot="YOUR_FOOTER_AD_SLOT"></ad-component>

    <div class="footer">
      <div class="left">
        <div>
          Created by:
          <a href="https://www.linkedin.com/in/mariusflagstad/" target="_blank"
            >Marius Zell-Flagstad</a
          >
        </div>
        <div class="info">
          I love board games and coding, and randomization is something code
          handles well. What started as a quick hobby project built in a few
          days has grown into something more. Seeing how many people enjoyed it,
          I rebuilt the entire site to be more robust and lasting. However,
          better infrastructure means higher server costs. If you find this site
          useful, I'd appreciate a donation to help keep it running.
        </div>
        <div class="painted">
          Also,
          <a
            href="https://www.facebook.com/pg/mariusminis/photos/"
            target="_blank"
            >check out my painted minis!</a
          >
          :)
        </div>
      </div>
      <div class="right">
        <donate-button></donate-button>
        <!-- <div>A:{{ isAndroid }} - I:{{ isIOS }}</div> -->
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import DonateButton from "./views/Donate/DonateButton";
import AdComponent from "./components/AdComponent";
export default {
  components: { DonateButton, AdComponent },
  data() {
    return {
      showInstallUIAndroid: false,
      showInstallUIIos: false,
      showInstallGuide: false,
      deferredPrompt: undefined,
      isAndroid: false,
      isIOS: false,
      cookieKey: [
        "showInstallUIAndroid",
        "showInstallGuideAndroid",
        "showInstallUIIos"
      ]
    };
  },
  computed: {
    ...mapState("user", []),
    ...mapGetters("page", ["isLoading", "loadingTime"])
  },
  methods: {
    async installApp() {
      this.$cookies.set(this.cookieKey[0], "closed", 60 * 60 * 24 * 7); // 7 days
      this.showInstallUIAndroid = false;
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      this.deferredPrompt = null;
    },
    installClose(cookieKey) {
      this.$cookies.set(cookieKey, "closed", 60 * 60 * 24 * 7); // 7 days
      this.showInstallUIAndroid = false;
      this.showInstallUIIos = false;
      this.showInstallGuide = false;
    }
  },
  mounted() {
    this.showInstallGuide =
      window.location.origin.indexOf("randomboardgame.zellflagstad.com") > -1 &&
      !this.$cookies.get(this.cookieKey[1]) &&
      !this.showInstallUIAndroid;
  },
  async created() {
    var w;
    w = window ? window.innerWidth : w;
    w =
      document && document.documentElement
        ? document.documentElement.clientWidth
        : w;
    w = document && document.body ? document.body.clientWidth : w;
    this.isIOS =
      /iPhone|iPad|Mac|Macintosh|iPod/i.test(navigator.userAgent) && w < 1400;
    this.isAndroid = /Android/i.test(navigator.userAgent) && w < 1400;
    if (this.isIOS && !this.$cookies.get(this.cookieKey[2]))
      this.showInstallUIIos = true;

    let self = this;
    window.addEventListener("beforeinstallprompt", e => {
      // Does not trigger on iOS!!
      console.log("beforeinstallprompt");
      e.preventDefault();
      self.deferredPrompt = e;
      if (!self.$cookies.get(self.cookieKey[0]))
        self.showInstallUIAndroid = true;
      self.showInstallGuide = false;
      console.log(`'beforeinstallprompt' event was fired.`);
    });
    window.addEventListener("appinstalled", () => {
      self.showInstallUIAndroid = false;
      self.showInstallGuide = false;
      self.deferredPrompt = null;
      console.log("PWA was installed");
    });
    await this.$store.dispatch("user/getLoginSession");
  }
};
</script>

<style lang="less">
#app {
  font-family: "Josefin Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
.install-app {
  position: fixed;
  z-index: 999;
  background: #f76331;
  width: 100%;
  border-top: 1px solid black;
  line-height: 24px;
  padding: 10px 0;
  //height: 2vh;
  bottom: 0;
  .install-text {
    margin-top: 5px;
    color: white;
    width: 60%;
    left: 0;
    display: inline-block;
    a {
      color: white;
    }
    &.full {
      width: 80%;
      margin-left: 10px;
      @media (max-width: 600px) {
        text-align: left;
        float: left;
      }
    }
  }
  .close {
    position: absolute;
    right: 10px;
    top: 10px;
    img {
      cursor: pointer;
      width: 30px;
      height: 30px;
    }
  }
  span {
    margin-right: 20px;
  }
  button {
    width: 20%;
    margin-bottom: 5px;
    margin-left: 2%;
    vertical-align: bottom;
    display: inline-block;
    background: white;
    border-radius: 4px;
    padding: 10px;
  }
}
body {
  margin: 0;
}
.spinner {
  position: fixed;
  bottom: -100%;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 99;
  background: black;
  opacity: 0;
  transition: 1s all;
  &.active {
    bottom: 0;
    opacity: 0.8;
  }
  h2 {
    margin-top: 25vh;
    color: white;
  }
  #loading {
    display: inline-block;
    width: 150px;
    height: 150px;
    border: 10px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: #fff;
    animation: spin 0.5s ease-in-out infinite;
    -webkit-animation: spin 0.5s ease-in-out infinite;
  }

  @keyframes spin {
    to {
      -webkit-transform: rotate(360deg);
    }
  }
  @-webkit-keyframes spin {
    to {
      -webkit-transform: rotate(360deg);
    }
  }
}
h1 {
  margin: 70px;
  display: inline-block;
  position: relative;
  .dice-container {
    position: absolute;
    right: -50px;
    top: -10px;
  }
  .border {
    border-bottom: 4px solid #f76331;
    width: 40px;
    height: 4px;
    position: absolute;
    left: -70px;
    top: 5px;
    &.back {
      left: inherit;
      right: -70px;
    }
  }
}
p {
  font-size: 16px;
  line-height: 20px;
}
.footer {
  padding: 50px;
  background: #f76331;
  color: #fff;
  a {
    color: #fff;
  }
  .left,
  .right {
    width: 50%;
    display: inline-block;
    vertical-align: top;
    .painted {
      margin-top: 5px;
    }
    .info {
      margin: 10px 0;
      font-size: 12px;
      line-height: 16px;
      max-width: 500px;
      text-align: center;
      display: inline-block;
    }
  }
  @media (max-width: 990px) {
    .left,
    .right {
      width: 100%;
    }
    .right {
      margin-top: 50px;
    }
  }
}
</style>
