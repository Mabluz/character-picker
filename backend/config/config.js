require("dotenv").config();

const debug = process.env.NODE_ENV !== "production";

module.exports = {
  mainGamePrefix: "maingame____",
  userPrefix: "usergame_____",
  mainGameUUIDPrefix: "maingame---",
  userGameUUIDPrefix: "usergame---",
  serverFullUrl: debug
    ? "http://localhost:1337/"
    : "https://randomboardgame.com/api/",
  cacheForMinutes: 1000 * 60 * 180,
  emailFrom: process.env.EMAIL_FROM,
  emailLandingPagePasswordReset: debug
    ? "http://localhost:8080/#/password-reset/"
    : "https://randomboardgame.com/#/password-reset/",
  adminAuthUser: process.env.ADMIN_AUTH_USER,
  adminAuthPass: process.env.ADMIN_AUTH_PASS,
  adminAuthUser2: process.env.ADMIN_AUTH_USER2,
  adminAuthPass2: process.env.ADMIN_AUTH_PASS2,
  emailID: process.env.EMAIL_ID
};
