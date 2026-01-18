"use strict";
const Cache = require("cache");
const uuid = require("uuid");
const config = require("../config/config");
const database = require("./database");
let emailService = require("./emailSetup");

let c = new Cache(config.cacheForMinutes);

let generateUserKey = (user, password) => {
  user = user.toLowerCase().trim();
  password = password.toLowerCase().trim();
  let uLength = user.length;
  let pLength = password.length;
  let factor = uLength * pLength;

  let key1 = password.toString()[parseInt((pLength - 1) / 2)];
  let key2 = keySetup(password.toString()[parseInt((pLength - 1) / 6)]);
  let key3 = password.toString()[parseInt((pLength - 1) / 4)];
  let key4 = keySetup(password.toString()[parseInt((pLength - 1) / 1)]);
  let key5 = password.toString()[parseInt((pLength - 1) / 3)];
  let key6 = keySetup(password.toString()[parseInt((pLength - 1) / 5)]);

  return uLength + key3 + key2 + pLength + key1 + key4 + factor + key6 + key5;

  function keySetup(keySet) {
    let keys = [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
      "ø",
      "ø",
      "å",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9"
    ];
    let key = keys.indexOf(keySet.toLowerCase());
    if (key === -1) return 5;
    return key;
  }
};

let getUserAccount = async userEmail => {
  const email = userEmail.toLowerCase().trim();
  const cacheKey = config.userPrefix + email;
  let cachedUser = c.get(cacheKey);

  if (cachedUser) {
    console.log("User cache used");
    return cachedUser;
  }

  console.log("User PostgreSQL used");
  const result = await database.query(
    `SELECT u.id, u.email, u.user_key, u.token, u.token_time, u.new_user_data,
            COALESCE(json_agg(ug.game_data) FILTER (WHERE ug.id IS NOT NULL), '[]') as data
     FROM users u
     LEFT JOIN user_games ug ON u.id = ug.user_id
     WHERE LOWER(u.email) = $1
     GROUP BY u.id`,
    [email]
  );

  if (result.rows.length === 0) {
    return { error: "User not found" };
  }

  const row = result.rows[0];
  const userData = {
    userId: row.id,
    email: row.email,
    userKey: row.user_key,
    token: row.token,
    tokenTime: row.token_time ? parseInt(row.token_time) : null,
    newUserData: row.new_user_data,
    data: row.data || []
  };

  c.put(cacheKey, userData);
  return userData;
};

let signUpUser = async (userEmail, userPassword) => {
  const email = userEmail.toLowerCase().trim();
  const userKey = generateUserKey(userEmail, userPassword);
  const token = uuid();
  const tokenTime = new Date().getTime();

  const result = await database.query(
    `INSERT INTO users (email, user_key, token, token_time)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [email, userKey, token, tokenTime]
  );

  clearUserCache(email);

  return {
    answer: {
      email: email,
      token: token,
      data: []
    }
  };
};

const resetPassword = async (data, userEmail, userPassword) => {
  const newToken = uuid();
  const newTokenTime = new Date().getTime();
  const newUserKey = generateUserKey(userEmail, userPassword);

  const newUserData = {
    userKey: newUserKey,
    token: newToken,
    tokenTime: newTokenTime
  };

  await database.query(
    `UPDATE users SET new_user_data = $1, updated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify(newUserData), data.userId]
  );

  clearUserCache(data.email);

  emailService.sendResetPassword(userEmail, newToken);

  return {
    answer:
      "Password change request sent to your email. You need to verify the password change there. Make sure you check your spam folder."
  };
};

const preformPasswordReset = async data => {
  const newUserData = data.newUserData;

  await database.query(
    `UPDATE users SET user_key = $1, new_user_data = NULL, updated_at = NOW()
     WHERE id = $2`,
    [newUserData.userKey, data.userId]
  );

  clearUserCache(data.email);

  return {
    answer: "Your password is now changed!"
  };
};

let clearUserCache = userEmail => {
  const cacheKey = config.userPrefix + userEmail.toLowerCase().trim();
  c.put(cacheKey, false);
};

let newLogin = async data => {
  const token = uuid();
  const tokenTime = new Date().getTime();

  await database.query(
    `UPDATE users SET token = $1, token_time = $2, updated_at = NOW()
     WHERE id = $3`,
    [token, tokenTime, data.userId]
  );

  clearUserCache(data.email);

  // Get fresh data
  const gamesResult = await database.query(
    "SELECT game_data FROM user_games WHERE user_id = $1",
    [data.userId]
  );

  const games = gamesResult.rows.map(row => row.game_data);

  return {
    answer: {
      email: data.email,
      token: token,
      data: games
    }
  };
};

let validateUser = async (email, token, onlyGetData = true) => {
  if (email && token) {
    let userAccount = await getUserAccount(email);
    if (userAccount.email === email && userAccount.token === token) {
      let date = new Date().getTime();
      let timeDiff = date - userAccount.tokenTime;
      if (timeDiff < 1000 * 60 * 60 * 24 * 14) {
        // 14 days
        return {
          login: true,
          data: onlyGetData ? userAccount.data : userAccount
        };
      }
    }
  }
  return {
    login: false
  };
};

const adminGetAllUsers = async (backupData = false) => {
  const result = await database.query(
    `SELECT u.id, u.email, u.user_key, u.token, u.token_time, u.new_user_data,
            COALESCE(json_agg(ug.game_data) FILTER (WHERE ug.id IS NOT NULL), '[]') as data
     FROM users u
     LEFT JOIN user_games ug ON u.id = ug.user_id
     GROUP BY u.id`
  );

  let users = result.rows.map(row => ({
    userId: row.id,
    email: row.email,
    userKey: backupData ? row.user_key : undefined,
    token: backupData ? row.token : undefined,
    tokenTime: row.token_time ? parseInt(row.token_time) : null,
    newUserData: backupData ? row.new_user_data : undefined,
    data: row.data || [],
    uuid: backupData ? undefined : uuid()
  }));

  if (!backupData) {
    users = users.map(user => {
      delete user.newUserData;
      delete user.token;
      delete user.userKey;
      return user;
    });
  }

  console.log("PostgreSQL admin overview users returned!");
  return users;
};

module.exports = {
  generateUserKey,
  getUserAccount,
  signUpUser,
  resetPassword,
  preformPasswordReset,
  validateUser,
  newLogin,
  clearUserCache,
  adminGetAllUsers
};
