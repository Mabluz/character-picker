<template>
  <div>
    <!-- Spinning dice credit: https://codepen.io/jpanter/pen/PGqJOm -->
    <div class="dice-container" :class="{ stop: stopSpinn }">
      <div class="dice" id="dice">
        <div class="front">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="back">
          <span></span>
        </div>
        <div class="right">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="left">
          <span></span>
          <span></span>
        </div>
        <div class="top">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="bottom">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "SpinningDice",
  data() {
    return {
      stopSpinn: false
    };
  },
  created() {
    let self = this;
    let randoms = [1050, 2010, 3030, 4030, 5030, 6030];
    let random = parseInt(randoms.length * Math.random());
    setTimeout(() => {
      self.stopSpinn = true;
      var pic1 = document.getElementById("dice");
      pic1.style.webkitAnimationPlayState = "paused";
    }, randoms[random]);
  }
};
</script>

<style scoped lang="less">
main {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.add-keyframe {
  animation-name: rotate;
  animation-iteration-count: 2;
  animation-duration: 3s;
  animation-timing-function: ease-in-out;
  animation-name: opacity;
}

.dice {
  animation-name: rotate;
  animation-iteration-count: infinite;
  animation-duration: 3s;
  animation-timing-function: ease-in-out;
  transform-style: preserve-3d;
  transform: rotateX(0deg) rotateY(0deg) translateX(0);
  width: 60px;
  height: 60px;
  position: relative;
  > div {
    height: 60px;
    width: 60px;
    position: absolute;
    background: #f76331;
  }

  span {
    width: 8px;
    height: 8px;
    background: #fff;
    border-radius: 50%;
    display: block;
    position: absolute;
  }

  .front {
    transform: rotateY(0deg) translateZ(30px);

    span {
      &:nth-child(1) {
        top: 10px;
        left: 12px;
      }
      &:nth-child(2) {
        top: 10px;
        right: 12px;
      }
      &:nth-child(3) {
        top: 26px;
        left: 12px;
      }
      &:nth-child(4) {
        top: 26px;
        right: 12px;
      }
      &:nth-child(5) {
        bottom: 10px;
        left: 12px;
      }
      &:nth-child(6) {
        bottom: 10px;
        right: 12px;
      }
    }
  }
  .back {
    transform: rotateX(180deg) translateZ(30px);

    span {
      top: 26px;
      left: 26px;
    }
  }
  .right {
    transform: rotateY(90deg) translateZ(30px);

    span {
      &:nth-child(1) {
        top: 12px;
        left: 12px;
      }
      &:nth-child(2) {
        top: 12px;
        right: 12px;
      }
      &:nth-child(3) {
        top: 26px;
        left: 26px;
      }
      &:nth-child(4) {
        bottom: 12px;
        left: 12px;
      }
      &:nth-child(5) {
        bottom: 12px;
        right: 12px;
      }
    }
  }
  .left {
    transform: rotateY(-90deg) translateZ(30px);

    span {
      &:nth-child(1) {
        top: 12px;
        right: 12px;
      }
      &:nth-child(2) {
        bottom: 12px;
        left: 12px;
      }
    }
  }
  .top {
    transform: rotateX(90deg) translateZ(30px);

    span {
      &:nth-child(1) {
        top: 12px;
        right: 12px;
      }
      &:nth-child(2) {
        bottom: 12px;
        left: 12px;
      }
      &:nth-child(3) {
        bottom: 26px;
        left: 26px;
      }
    }
  }
  .bottom {
    transform: rotateX(-90deg) translateZ(30px);

    span {
      &:nth-child(1) {
        top: 12px;
        right: 12px;
      }
      &:nth-child(2) {
        top: 12px;
        left: 12px;
      }
      &:nth-child(3) {
        bottom: 12px;
        left: 12px;
      }
      &:nth-child(4) {
        bottom: 12px;
        right: 12px;
      }
    }
  }
}

@keyframes opacity {
  0% {
    opacity: 1;
  }
  20% {
    opacity: 0.5;
  }
  40% {
    opacity: 1;
  }
  60% {
    opacity: 1;
  }
  80% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes rotate {
  0% {
    transform: rotateX(90deg) rotateY(360deg) rotateZ(0deg) translateX(0);
  }
  35% {
    transform: rotateX(-180deg) rotateY(-90deg) rotateZ(0deg) translateX(0);
  }
  45% {
    transform: rotateX(-180deg) rotateY(-90deg) rotateZ(0deg) translateX(0);
  }
  65% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(-360deg) translateX(0);
  }
  75% {
    transform: rotateX(0deg) rotateY(0deg) rotateZ(-360deg) translateX(0);
  }
  100% {
    transform: rotateX(90deg) rotateY(360deg) rotateZ(0deg) translateX(0);
  }
}
</style>
