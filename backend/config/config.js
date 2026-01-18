require('dotenv').config();

const debug = process.env.NODE_ENV !== 'production';

module.exports = {
  authCodeForMainPush: process.env.AUTH_CODE_FOR_MAIN_PUSH,
  customHeaderMainPush: process.env.CUSTOM_HEADER_MAIN_PUSH,
  mainGamePrefix: "maingame____",
  userPrefix: "usergame_____",
  mainGameUUIDPrefix: "maingame---",
  userGameUUIDPrefix: "usergame---",
  serverFullUrl: debug
    ? "http://localhost:1337/"
    : "https://character-picker-backend.herokuapp.com/",
  cacheForMinutes: 1000 * 60 * 180,
  emailKey: process.env.EMAIL_KEY,
  emailFrom: process.env.EMAIL_FROM,
  emailLandingPagePasswordReset: debug
    ? "http://localhost:8080/#/password-reset/"
    : "http://www.randomboardgame.com/#/password-reset/",
  adminAuthUser: process.env.ADMIN_AUTH_USER,
  adminAuthPass: process.env.ADMIN_AUTH_PASS,
  adminAuthUser2: process.env.ADMIN_AUTH_USER2,
  adminAuthPass2: process.env.ADMIN_AUTH_PASS2,
  emailID: process.env.EMAIL_ID
};
