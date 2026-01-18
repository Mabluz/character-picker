<template>
  <div class="search-field">
    <!-- Search field credit: https://codemyui.com/animated-search-icon-input-field-transition/ -->
    <form :class="{ open: inputOpen, in: animateIn, close: inputClose }">
      <input
        @focus="searchFocus"
        @keyup="typing"
        @change="typing"
        type="text"
        v-model="inputValue"
      />
      <div class="after" @click="closeSearch"></div>
      <input type="submit" />
    </form>
    <h4>&nbsp;</h4>
    <div class="help" v-if="!animateIn && !inputOpen">Search for games</div>
  </div>
</template>

<script>
export default {
  name: "SearchInput",
  data() {
    return {
      inputOpen: false,
      inputClose: false,
      animateIn: false,
      inputValue: ""
    };
  },
  methods: {
    searchFocus() {
      if (this.inputOpen) return;
      this.animateIn = true;
      let self = this;
      setTimeout(function() {
        self.inputOpen = true;
        self.animateIn = false;
      }, 1100);
    },
    closeSearch() {
      if (!this.inputOpen) return;
      this.inputValue = "";
      this.inputClose = true;
      this.inputOpen = false;
      this.$emit("search", this.inputValue);
      let self = this;
      setTimeout(function() {
        self.inputClose = false;
      }, 1100);
    },
    typing() {
      this.$emit("search", this.inputValue);
    }
  }
};
</script>

<style scoped lang="less">
.search-field {
}

.help {
  font-size: 14px;
}

input {
  cursor: pointer;
}

.open input,
.in input {
  cursor: inherit;
}

h4 {
  color: #000;
  text-align: center;
  letter-spacing: 0.5px;
  transform: scale(0);
  transition: all 0.3s;
  position: relative;
  top: -25px;
  margin: 0;
  font-weight: normal;
}
@keyframes alert {
  0% {
    transform: scale(0);
  }
  80% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
form {
  transition: all 0.15s;
}
html {
  padding-top: 100px;
}
form {
  width: 36px;
  height: 36px;
  margin: 0 auto;
  display: block;
  box-sizing: border-box;
  position: relative;
}
input[type="submit"] {
  display: none !important;
}
input {
  width: 100%;
}
input {
  background: none;
  border: 3px solid #000;
  border-radius: 26px;
  box-sizing: border-box;
  padding: 5px 15px 7px;
  font-size: 14px;
  color: #000;
  z-index: 2;
  position: relative;
}
input:focus {
  outline: none;
}
.after {
  width: 36px;
  height: 36px;
  position: absolute;
  top: 1px;
  right: 0;
  z-index: 1;
}
form.open .after {
  cursor: pointer;
}
.after:before,
.after:after {
  content: "";
  width: 13px;
  height: 3px;
  background-color: #000;
  border-radius: 3px;
  position: absolute;
  transform-origin: 100% 100%;
}
.after:after {
  bottom: -3px;
  right: -3px;
  transform: rotate(45deg);
}
.after:before {
  top: -3px;
  right: -3px;
  transform: rotate(-45deg);
  opacity: 0;
}
form,
form .after,
form .after:before,
form .after:after {
  animation-duration: 1.1s;
  animation-fill-mode: forwards;
}
form.in {
  animation-name: expand;
}
form.in .after:before {
  animation-name: beforemagic;
}
form.in .after:after {
  animation-name: aftermagic;
}

form.close,
form.close .after,
form.close .after:before,
form.close .after:after {
  animation-direction: reverse;
}
form.close {
  animation-name: expand;
}
form.close .after:before {
  animation-name: beforemagic;
}
form.close .after:after {
  animation-name: aftermagic;
}

/* Hold final focused state
     ****************************/
form.open {
  width: 250px;
  color: #000;
}
form.open .after {
  z-index: 3;
}
form.open .after:before {
  width: 20px;
  top: 9px;
  right: 13px;
  opacity: 1;
}
form.open .after:after {
  width: 20px;
  bottom: 10px;
  right: 15px;
}

@keyframes aftermagic {
  0% {
  }
  10% {
    width: 24px;
    bottom: -10px;
    right: -10px;
  }
  15% {
    opacity: 1;
  }
  35% {
    width: 13px;
    bottom: -3px;
    right: -3px;
    opacity: 0;
  }
  25% {
    opacity: 0;
  }
  64% {
    opacity: 0;
  }
  65% {
    opacity: 1;
    width: 13px;
    bottom: -2px;
    right: -3px;
  }
  75% {
    width: 30px;
    bottom: 4px;
    right: 10px;
  }
  90% {
    width: 20px;
    bottom: 10px;
    right: 15px;
  }
  100% {
    width: 20px;
    bottom: 10px;
    right: 15px;
  }
}
@keyframes beforemagic {
  0% {
  }
  50% {
    opacity: 0;
  }
  55% {
    opacity: 1;
    width: 13px;
    top: -4px;
    right: -3px;
  }
  65% {
    width: 30px;
    top: 6px;
    right: 10px;
  }
  80% {
    width: 20px;
    top: 9px;
    right: 13px;
  }
  100% {
    width: 20px;
    top: 9px;
    right: 13px;
    opacity: 1;
  }
}
@keyframes expand {
  0% {
    color: transparent;
  }
  20% {
    width: 36px;
  }
  45% {
    width: 250px;
  }
  99% {
    color: transparent;
  }
  100% {
    width: 250px;
    color: #000;
  }
}
</style>
