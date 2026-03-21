<template>
  <div :class="[size, { 'no-btn-margin': noButtonMargin }]">
    <div v-if="userLoggedIn">
      <h2>Hi {{ getUserNameByEmail }}</h2>
      <char-button v-if="!isLocalUser" :size="size" @click="logOut">Log out</char-button>
      <char-button v-else :size="size" color="black" @click="confirmDeleteLocal">Delete account</char-button>
      <div v-if="showDeleteWarning" class="delete-warning">
        <p>This will permanently delete your local account and all saved games. This cannot be undone.</p>
        <char-button class="delete-confirm-btn" color="black" @click="logOut">Yes, delete everything</char-button>
        <char-button @click="showDeleteWarning = false">Cancel</char-button>
      </div>
    </div>
    <div v-else>
      <h2><slot></slot></h2>
      <div class="google-login-wrapper">
        <div ref="googleBtn" class="google-btn-container"></div>
        <div v-if="googleError" class="error">{{ googleError }}</div>
      </div>
      <div class="or-separator"><span>or</span></div>
      <div class="go-container">
        <char-button :size="size" @click="toggleOpen">
          <span v-if="!openLogin">Sign in / Sign up</span>
          <span v-else>Nah, not now</span>
        </char-button>
      </div>
      <div class="login-container" :class="{ closed: !openLogin }">
        <!-- Credit to form html: https://codemyui.com/one-form-register-login-forgot-password-css/ -->
        <div class="flex-wrap">
          <fieldset>
            <form action novalidate>
              <input
                  type="radio"
                  name="rg"
                  @click="selectRadio(0)"
                  id="sign-in"
                  checked
              />
              <input
                  type="radio"
                  name="rg"
                  @click="selectRadio(1)"
                  id="sign-up"
              />
              <input
                  type="radio"
                  name="rg"
                  @click="selectRadio(2)"
                  id="reset"
              />

              <label for="sign-in">Sign in</label>
              <label for="sign-up">Sign up</label>
              <label for="reset">Reset</label>

              <input
                  class="sign-up sign-in reset"
                  type="email"
                  placeholder="Your Email"
                  v-model="inputEmail"
                  @keyup="enterPressed"
              />
              <div class="error" v-if="inputEmailError">
                {{ inputEmailError }}
              </div>
              <div class="reset-text" :class="{ show: selectedIndex === 2 }">
                Choose your new password
              </div>
              <input
                  class="sign-up sign-in reset"
                  type="password"
                  placeholder="Your Password"
                  v-model="inputPassword"
                  @keyup="enterPressed"
              />
              <div class="error" v-if="inputPasswordError">
                {{ inputPasswordError }}
              </div>
              <input
                  class="sign-up reset"
                  type="password"
                  placeholder="Repeat Password"
                  v-model="inputRepeat"
                  @keyup="enterPressed"
              />
              <div class="error" v-if="inputRepeatError">
                {{ inputRepeatError }}
              </div>
              <div class="error" v-if="inputGeneralError">
                {{ inputGeneralError }}
              </div>
              <char-button color="black" @click="submit">{{
                  getButtonText
                }}</char-button>

              <div
                  class="password-reset-answer"
                  v-if="passwordResetAnswer && this.selectedIndex === 2"
              >
                {{ passwordResetAnswer }}
              </div>
            </form>
          </fieldset>
        </div>
      </div>
      <div class="or-separator"><span>or</span></div>
      <div class="go-container">
        <char-button color="black" @click="saveLocally">Save locally (no account)</char-button>
      </div>
      <div class="local-login-hint">Your account is only saved in this browser. Link to an online (email/google) account later.</div>
      <div v-if="localLoginError" class="error">{{ localLoginError }}</div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import CharButton from "../CharButton";
import config from "../../../config/config";
export default {
  name: "Login",
  props: ["size", "noButtonMargin"],
  components: { CharButton },
  data() {
    return {
      inputEmail: undefined,
      inputPassword: undefined,
      inputRepeat: undefined,
      inputEmailError: false,
      inputPasswordError: false,
      inputRepeatError: false,
      inputGeneralError: false,
      openLogin: false,
      selectedIndex: 0,
      passwordResetAnswer: undefined,
      googleError: undefined,
      localLoginError: undefined,
      showDeleteWarning: false
    };
  },
  mounted() {
    this.initGoogleSignIn();
  },
  watch: {
    userLoggedIn(val) {
      if (!val) {
        this.$nextTick(() => this.initGoogleSignIn());
      }
    }
  },
  computed: {
    ...mapGetters("user", ["userLoggedIn", "getUserNameByEmail", "isLocalUser"]),
    getButtonText() {
      if (this.selectedIndex === 0) return "Sign In";
      if (this.selectedIndex === 1) return "Sign Up";
      if (this.selectedIndex === 2) return "Reset password";
      return "";
    }
  },
  methods: {
    initGoogleSignIn() {
      const tryInit = () => {
        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id: config.googleClientId,
            callback: this.handleGoogleCredential
          });
          window.google.accounts.id.renderButton(this.$refs.googleBtn, {
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: 250
          });
        } else {
          setTimeout(tryInit, 200);
        }
      };
      tryInit();
    },
    async handleGoogleCredential(response) {
      this.googleError = undefined;
      const result = await this.$store.dispatch(
        "user/googleLogin",
        response.credential
      );
      if (result && result.error) {
        this.googleError = result.error;
      } else {
        await this.$store.dispatch("user/getLoginSession");
      }
    },
    async enterPressed(event) {
      if (event && event.keyCode === 13) {
        this.submit();
      }
    },
    async submit() {
      let self = this;
      let url;
      this.inputGeneralError = false;
      if (this.selectedIndex === 0) {
        if (!validateEmail()) return;
        if (!validatePassword()) return;
        url = "user/loginUser";
      } else if (this.selectedIndex === 1) {
        if (!validateEmail()) return;
        if (!validatePassword()) return;
        if (!validateRepeat()) return;
        url = "user/signupUser";
      } else if (this.selectedIndex === 2) {
        if (!validateEmail()) return;
        url = "user/resetPassword";
      }

      let response = await this.$store.dispatch(url, {
        email: this.inputEmail,
        password: this.inputPassword,
        repeat: this.inputRepeat
      });

      if (response && response.error) {
        this.inputGeneralError = response.error;
      } else if (this.selectedIndex === 2 && response.answer) {
        this.passwordResetAnswer = response.answer;
      } else {
        await this.$store.dispatch("user/getLoginSession");
      }

      if (!config.debug) {
        this.$ga.event({
          eventCategory: "Login",
          eventAction: url
        });
      }

      function validateRepeat() {
        if (!self.inputRepeat || self.inputRepeat === "") {
          self.inputRepeatError = "You need to fill out the repeat password";
          return false;
        }
        if (self.inputRepeat !== self.inputPassword) {
          self.inputRepeatError = "The two passwords does not match";
          return false;
        }
        return true;
      }

      function validatePassword() {
        if (!self.inputPassword || self.inputPassword === "") {
          self.inputPasswordError = "You need to fill out your password";
          return false;
        }
        return true;
      }

      function validateEmail() {
        if (!self.inputEmail || self.inputEmail === "") {
          self.inputEmailError = "You need to fill out your email";
          return false;
        }
        let re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(self.inputEmail)) {
          self.inputEmailError = "Email not valid";
          return false;
        }
        self.inputEmailError = undefined;
        return true;
      }
    },
    confirmDeleteLocal() {
      this.showDeleteWarning = true;
    },
    async saveLocally() {
      this.localLoginError = undefined;
      const result = await this.$store.dispatch("user/localLogin");
      if (result && result.error) {
        this.localLoginError = result.error;
      }
    },
    logOut() {
      this.$store.dispatch("user/logout", {});
      if (!config.debug) {
        this.$ga.event({
          eventCategory: "Login",
          eventAction: "user/logout"
        });
      }
    },
    toggleOpen() {
      this.openLogin = this.openLogin ? false : true;
    },
    selectRadio(index) {
      this.selectedIndex = index;
    }
  }
};
</script>

<style scoped lang="less">
@color-accent: #222;
@color-inactiveFields: #eee;
@color-focusedFields: #ddd;
@color-input: #f76331;

.small {
  h2 {
    font-size: 20px;
  }
}

h2 {
  padding-left: 10px;
  padding-right: 10px;
  line-height: 33px;
}

.login-container {
  max-height: 1000px;
  overflow: hidden;
  transition: 1s max-height;
  &.closed {
    max-height: 0;
  }
}

.error {
  color: @color-input;
  margin: 5px 0 8px 0;
}

fieldset {
  border: 0;
}
input[type="radio"] {
  position: fixed;
  left: -100px;
}
input:not([type="radio"]) {
  appearance: none;
  background-color: @color-inactiveFields;
  display: block;
  transition: 300ms ease;
  border-radius: 7px;
  border: 0;
  max-height: 0;
  margin: 0;
  padding: 0 10px;
  overflow: hidden;
  width: 250px;
  opacity: 0;
  font-size: 16px;
  text-align: center;
  outline: 0;
  &:focus {
    background-color: @color-focusedFields;
  }
}
[id="sign-in"]:checked ~ input.sign-in,
[id="sign-up"]:checked ~ input.sign-up,
[id="reset"]:checked ~ input.reset {
  max-height: 40px;
  padding: 10px;
  margin: 10px 0;
  opacity: 1;
  &[type="email"] {
    margin-bottom: 0;
  }
}
.reset-text {
  max-height: 0;
  margin-top: 0;
  overflow: hidden;
  transition: 300ms ease;
  &.show {
    margin-top: 10px;
    max-height: 40px;
  }
}
label {
  position: relative;
  display: inline-block;
  text-align: center;
  font-weight: 700;
  cursor: pointer;
  color: @color-accent;
  transition: 300ms ease;
  width: calc(100% / 3 - 4px);
  &:after {
    content: "";
    border: 10px solid transparent;
    position: absolute;
    bottom: -10px;
    left: calc(50% - 10px);
    transition: inherit;
  }
}
[id="sign-in"]:checked ~ [for="sign-in"],
[id="sign-up"]:checked ~ [for="sign-up"],
[id="reset"]:checked ~ [for="reset"] {
  color: @color-input;
  &:after {
    border-bottom-color: @color-input;
  }
}
.google-login-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0;
}
.google-btn-container {
  display: flex;
  justify-content: center;
}
.or-separator {
  display: flex;
  align-items: center;
  margin: 12px auto;
  width: 250px;
  color: #999;
  font-size: 13px;
  &::before,
  &::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid #ddd;
  }
  span {
    padding: 0 10px;
  }
}
.delete-warning {
  margin-top: 12px;
  padding: 12px;
  border-top: 2px solid #f76331;
  border-bottom: 2px solid #f76331;
  background: #fff5f2;
  p {
    margin: 0 0 10px;
    font-size: 14px;
    line-height: 1.4;
  }
  button + button {
    margin-left: 8px;
  }
  .delete-confirm-btn {
    margin-bottom: 20px;
  }
}
.no-btn-margin .button-container {
  margin-bottom: 0;
}
.local-login-hint {
  font-size: 12px;
  color: #888;
  text-align: center;
  max-width: 350px;
  margin: 8px auto 8px;
}
.flex-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  min-height: 300px;
  text-align: center;
}
.password-reset-answer {
  max-width: 238px;
  text-align: center;
  display: inline-block;
  font-size: 18px;
  line-height: 24px;
}
</style>
