<template>
  <div id="app">
    <div class="spinner" :class="{ active: isLoading }">
      <h2>Loading...</h2>
      <div id="loading"></div>
    </div>

    <div class="install-app" v-if="showInstallUIAndroid && isAndroid">
      <button
        class="install-close"
        @click="installClose(cookieKey[0])"
        aria-label="Close"
      >
        &times;
      </button>
      <div class="install-body">
        <div class="install-text">
          Install <strong>Random Board Game</strong> as an app on your Android
          device.
        </div>
        <button class="install-btn" @click="installApp">Install</button>
      </div>
    </div>
    <div class="install-app" v-if="showInstallUIIos && isIOS">
      <button
        class="install-close"
        @click="installClose(cookieKey[1])"
        aria-label="Close"
      >
        &times;
      </button>
      <div class="install-body">
        <div class="install-text">
          Add <strong>Random Board Game</strong> to your iOS home screen:
          <span class="install-steps">Share &rarr; Add to Home Screen</span>
          <a href="https://www.youtube.com/watch?v=bV8xE6lOdoY" target="_blank"
            >See how on YouTube</a
          >
        </div>
      </div>
    </div>

    <div class="page-content">
      <router-view />
    </div>

    <div class="footer" ref="footer">
      <div class="footer-main">
        <div class="footer-col footer-about">
          <div class="footer-creator">
            Created by
            <a
              href="https://www.linkedin.com/in/mariusflagstad/"
              target="_blank"
              >Marius Zell-Flagstad</a
            >
          </div>
          <p class="footer-bio">
            I love board games and coding, and randomization is something code
            handles well. What started as a quick hobby project has grown into
            something more. Better infrastructure means higher server costs — if
            you find this site useful, I'd appreciate a donation to help keep it
            running.
          </p>
          <div class="footer-minis">
            Also,
            <a
              href="https://www.facebook.com/pg/mariusminis/photos/"
              target="_blank"
              >check out my painted minis!</a
            >
            :)
          </div>
        </div>
        <div class="footer-col footer-donate">
          <a
            ref="kofiFooter"
            href="https://ko-fi.com/F2F51VYOPV"
            target="_blank"
          >
            <img
              height="60"
              style="border:0px;height:60px;"
              src="https://storage.ko-fi.com/cdn/kofi6.png?v=6"
              border="0"
              alt="Buy Me a Coffee at ko-fi.com"
            />
          </a>
          <p class="donate-text">
            Thanks for stopping by! If you enjoy this project and want to help
            keep it alive, I'd really appreciate a small donation. Your support
            means a lot and helps me keep creating.
          </p>
        </div>
      </div>
      <div class="footer-bottom">
        <a href="https://boardgamegeek.com" target="_blank" rel="noopener">
          <img
            src="/powered_by_bgg.webp"
            alt="Powered by BoardGameGeek"
            class="bgg-logo"
          />
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
export default {
  components: {},
  data() {
    return {
      showInstallUIAndroid: false,
      showInstallUIIos: false,
      deferredPrompt: undefined,
      isAndroid: false,
      isIOS: false,
      cookieKey: ["showInstallUIAndroid", "showInstallUIIos"]
    };
  },
  computed: {
    ...mapState("user", []),
    ...mapGetters("page", ["isLoading", "loadingTime"]),
    installBannerVisible() {
      return (
        (this.showInstallUIAndroid && this.isAndroid) ||
        (this.showInstallUIIos && this.isIOS)
      );
    }
  },
  watch: {
    installBannerVisible(val) {
      document.body.classList.toggle("install-banner-active", val);
    }
  },
  methods: {
    async installApp() {
      this.$cookies.set(this.cookieKey[0], "closed", 60 * 60 * 24 * 7); // 7 days
      this.showInstallUIAndroid = false;
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      // eslint-disable-next-line no-console
      console.log(`User response to the install prompt: ${outcome}`);
      this.deferredPrompt = null;
    },
    installClose(cookieKey) {
      this.$cookies.set(cookieKey, "closed", 60 * 60 * 24 * 7); // 7 days
      this.showInstallUIAndroid = false;
      this.showInstallUIIos = false;
    }
  },
  beforeDestroy() {
    if (this._onScroll) window.removeEventListener("scroll", this._onScroll);
  },
  mounted() {
    if (this.installBannerVisible) {
      document.body.classList.add("install-banner-active");
    }

    this._onScroll = () => {
      if (sessionStorage.getItem("kofiDismissed")) return;
      const atBottom =
        window.innerHeight + window.scrollY >= document.body.scrollHeight - 100;
      const kofi = document.querySelector(
        ".floatingchat-container-wrap, .floatingchat-container-wrap-mobi"
      );
      if (kofi) {
        kofi.style.transition = "opacity 0.3s ease";
        kofi.style.opacity = atBottom ? "0" : "1";
        kofi.style.pointerEvents = atBottom ? "none" : "";
      }
    };
    window.addEventListener("scroll", this._onScroll);

    if (sessionStorage.getItem("kofiDismissed")) return;

    const script = document.createElement("script");
    script.src = "https://storage.ko-fi.com/cdn/scripts/overlay-widget.js";
    script.onload = () => {
      window.kofiWidgetOverlay.draw("mariuszellflagstad", {
        type: "floating-chat",
        "floating-chat.donateButton.text": "Support me",
        "floating-chat.donateButton.background-color": "#f45d22",
        "floating-chat.donateButton.text-color": "#fff"
      });
      setTimeout(() => {
        const widgets = document.querySelectorAll(
          ".floatingchat-container-wrap, .floatingchat-container-wrap-mobi"
        );
        widgets.forEach(widget => {
          const closeBtn = document.createElement("button");
          closeBtn.className = "kofi-close-btn";
          closeBtn.innerHTML = "&times;";
          closeBtn.addEventListener("click", e => {
            e.stopPropagation();
            e.preventDefault();
            sessionStorage.setItem("kofiDismissed", "1");
            widgets.forEach(w => {
              w.style.opacity = "0";
              w.style.pointerEvents = "none";
            });
          });
          widget.appendChild(closeBtn);
        });
      }, 1500);
    };
    document.body.appendChild(script);
  },
  async created() {
    var w;
    w = window ? window.innerWidth : w;
    w =
      document && document.documentElement
        ? document.documentElement.clientWidth
        : w;
    w = document && document.body ? document.body.clientWidth : w;
    this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) && w < 1400;
    this.isAndroid = /Android/i.test(navigator.userAgent) && w < 1400;
    if (this.isIOS && !this.$cookies.get(this.cookieKey[1]))
      this.showInstallUIIos = true;

    let self = this;
    window.addEventListener("beforeinstallprompt", e => {
      // Does not trigger on iOS!!
      // eslint-disable-next-line no-console
      console.log("beforeinstallprompt");
      e.preventDefault();
      self.deferredPrompt = e;
      if (!self.$cookies.get(self.cookieKey[0]))
        self.showInstallUIAndroid = true;
      // eslint-disable-next-line no-console
      console.log(`'beforeinstallprompt' event was fired.`);
    });
    window.addEventListener("appinstalled", () => {
      self.showInstallUIAndroid = false;
      self.deferredPrompt = null;
      // eslint-disable-next-line no-console
      console.log("PWA was installed");
    });
    await this.$store.dispatch("user/getLoginSession");

    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get("verifyEmail");
    if (verifyToken) {
      await this.$store.dispatch("user/verifyEmail", verifyToken);
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.hash
      );
    }
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
  bottom: 0;
  left: 0;
  width: 100%;
  background: #f76331;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.25);
  padding: 16px 52px 16px 20px;
  box-sizing: border-box;

  .install-close {
    position: absolute;
    top: 10px;
    right: 12px;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.8);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    transition: color 0.15s ease, background 0.15s ease;
    &:hover {
      color: #fff;
      background: rgba(0, 0, 0, 0.12);
    }
  }

  .install-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    max-width: 720px;
    margin: 0 auto;

    @media (max-width: 480px) {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }

  .install-text {
    color: #fff;
    font-size: 15px;
    line-height: 1.5;
    flex: 1;

    strong {
      font-weight: 700;
    }

    a {
      color: #fff;
      text-decoration: underline;
      text-underline-offset: 2px;
      &:hover {
        text-decoration-thickness: 2px;
      }
    }

    .install-steps {
      display: block;
      font-weight: 600;
      margin: 4px 0;
      letter-spacing: 0.3px;
    }
  }

  .install-btn {
    flex-shrink: 0;
    background: #fff;
    color: #f76331;
    font-size: 15px;
    font-weight: 700;
    border: none;
    border-radius: 8px;
    padding: 10px 28px;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transition: background 0.15s ease, transform 0.1s ease,
      box-shadow 0.15s ease;
    &:hover {
      background: #f0f0f0;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
    }
    &:active {
      transform: scale(0.97);
    }

    @media (max-width: 480px) {
      width: 100%;
      text-align: center;
    }
  }
}
body {
  margin: 0;
}
.kofi-close-btn {
  position: absolute;
  top: 14px;
  right: -3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #ccc;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  @media (max-width: 990px) {
    top: 0;
  }
  &:hover {
    background: #f5f5f5;
    color: #000;
  }
}
body.install-banner-active {
  .floatingchat-container-wrap,
  .floatingchat-container-wrap-mobi {
    display: none !important;
  }
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
  @media (min-width: 991px) {
    .dice-container {
      position: absolute;
      right: -50px;
      top: -10px;
    }
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
.page-content {
  min-height: calc(100vh - 300px);
}

.footer {
  background: #f76331;
  color: #fff;
  a {
    color: #fff;
  }

  .footer-main {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 40px;
    padding: 50px 50px 30px;

    @media (max-width: 990px) {
      flex-direction: column;
      padding: 40px 30px 20px;
      gap: 30px;
    }
  }

  .footer-col {
    flex: 0 1 320px;
  }

  .footer-about {
    text-align: center;
    max-width: 500px;
  }

  .footer-creator {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 10px;
    a {
      text-decoration: underline;
      text-underline-offset: 2px;
    }
  }

  .footer-bio {
    font-size: 12px;
    line-height: 18px;
    opacity: 0.85;
    margin: 0 0 10px;
  }

  .footer-minis {
    font-size: 13px;
    opacity: 0.9;
    a {
      text-decoration: underline;
      text-underline-offset: 2px;
    }
  }

  .footer-donate {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .donate-text {
    font-size: 12px;
    line-height: 17px;
    margin-top: 10px;
    opacity: 0.85;
    max-width: 280px;
  }

  .footer-bottom {
    border-top: 1px solid rgba(255, 255, 255, 0.25);
    padding: 20px 50px;
    display: flex;
    align-items: center;
    justify-content: flex-end;

    @media (max-width: 990px) {
      padding: 20px 30px;
      justify-content: center;
    }

    .bgg-logo {
      height: 40px;
      width: auto;
      opacity: 0.9;
      transition: opacity 0.15s ease;
      &:hover {
        opacity: 1;
      }
    }
  }
}
</style>
