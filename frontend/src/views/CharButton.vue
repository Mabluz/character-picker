<template>
  <div class="button-container" :class="[getColor, size]">
    <a :href="internalHref" class="bttn" @click="click"><slot></slot></a>
  </div>
</template>

<script>
export default {
  name: "CharButton",
  props: ["href", "color", "size"], // color = white, black, orange, || size = small
  data() {
    return {
      internalHref: "javascript:"
    };
  },
  computed: {
    getColor() {
      if (this.color) return this.color;
      return "black";
    }
  },
  methods: {
    click() {
      if (this.internalHref && this.internalHref === "javascript:") {
        this.$emit("click");
      }
    }
  },
  created() {
    if (this.href) this.internalHref = this.href;
  }
};
</script>

<style scoped lang="less">
.white {
  a.bttn {
    color: #fff;
    border: 3px solid #fff;
    &:before {
      background-color: #fff;
    }
    &:hover {
      background: #636363;
    }
  }
}

.black {
  a.bttn {
    color: #000;
    border: 3px solid #000;
    &:before {
      background-color: #000;
    }
    &:hover {
      background: #cfcfcf;
    }
  }
}

.orange {
  a.bttn {
    color: #fff;
    background: #f76331;
    border: 3px solid #000;
    &:before {
      background-color: #000;
    }
    &:hover {
      background: #b44520;
    }
  }
}

*,
*::before,
*::after {
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
}

.button-container {
  display: flex;
  align-items: center;
  justify-content: center;

  &.small {
    .bttn {
      font-size: 14px;
      line-height: 16px;
      min-width: 140px;
      padding: 7px 7px;
    }
  }
}

a.bttn {
  text-decoration: none;
  -webkit-transition: 0.3s all ease;
  transition: 0.3s ease all;
  cursor: pointer;
}

.bttn {
  letter-spacing: 2px;
  text-transform: uppercase;
  display: inline-block;
  text-align: center;
  font-weight: bold;
  min-width: 270px;
  padding: 14px 10px;
  font-size: 18px;
  border-radius: 2px;
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.1);
  &:hover {
    &:before {
      -webkit-transition: 0.5s all ease;
      transition: 0.5s all ease;
      left: 0;
      right: 0;
      opacity: 1;
    }
  }
}
</style>
