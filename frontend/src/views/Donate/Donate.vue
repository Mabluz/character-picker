<template>
  <div class="donate">
    <page-tabs :currentPage="'Donate'"></page-tabs>
    <h1>Hi, thanks for the interest in this site!</h1>
    <div class="info">
      <p>
        I really appreciate that you are all using this site so much, and I hope
        you love it and find it useful.
      </p>
      <h2>Some background story</h2>
      <p>
        I work as a web developer here in Norway, and have always loved doing my
        own hobby projects on the web. In 2013 I stumbled over boardgames on
        Kickstarter and fell in love with this great hobby as well. So much that
        I stopped playing video games, and went "all in" on board games.
      </p>
      <p>
        While enjoying the hobby I found the drafting of heroes and monsters a
        bit tedious. Creating some kind of system, rolling a dice or what not.
        Enjoying making things on the web I created the first version of this
        site. Thrown together in a couple of days while commuting from / to
        work. It was a quick and dirty hobby project, but it did the job. I
        posted the site on a couple of forums, and over time it became popular.
      </p>
      <p>
        Seeing it being used and enjoyed by all these people and having so many
        thoughts myself about what it could be I started recreating the entire
        site. I built it to last with the latest frontend framework and a
        backend API system to store the data. A user system to be able to create
        your own lists and what not. All this is now deployed and hosted on
        heroku.com, a site where the hosting is free as long as the websites
        traffic is not through the roof / being to popular. I could have kept
        the site to myself and surfed on herokus free hosting, but no that's not
        what I want. I want as many people as possible to enjoy this site, and
        that will increase the server cost over time.
      </p>
      <p>
        I will cover as much as I can with my own money, but if you love this
        site and want to help out I appreciate any help I can get.
        <b>All money raised will only go towards covering server cost.</b>
      </p>
      <donate-button :color="'black'" :displayinfo="false"></donate-button>
      <p>
        This is by no means a desperate plead for help and money, and I
        appreciate your love and support for the site even without any
        donations.
      </p>
      <p>Thanks for enjoying the site!</p>
      <spinning-dice class="spinning-dice-adjustments"></spinning-dice>
      <p>Keep those dice rolling!</p>
    </div>
  </div>
</template>

<script>
//https://www.paypal.com/cgi-bin/customerprofileweb?cmd=_button-management

import DonateButton from "./DonateButton";
import SpinningDice from "../GameSelection/SpinningDice";
import PageTabs from "../PageTabs/PageTabs";
export default {
  name: "Donate",
  components: { PageTabs, SpinningDice, DonateButton },
  created() {
    window.scrollTo(0, 0);
  }
};
</script>

<style scoped lang="less">
.donate {
  max-width: 800px;
  display: inline-block;
  text-align: center;
  p {
  }
  .spinning-dice-adjustments {
    text-align: center;
    display: inline-block;
  }
}
</style>
