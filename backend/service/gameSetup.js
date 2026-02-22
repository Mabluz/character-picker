"use strict";
const Cache = require("cache");
const config = require("../config/config");
const emailSetup = require("./emailSetup");
const userSetup = require("./userSetup");
const database = require("./database");
const uuid = require("uuid");

let c = new Cache(config.cacheForMinutes);

let getMainGame = async (gamename = undefined) => {
  if (!gamename) {
    // Get overview
    let cachedOverview = c.get(config.mainGamePrefix + "all");
    if (cachedOverview) {
      console.log("Cached overview returned!");
      return cachedOverview;
    }

    const result = await database.query(
      "SELECT id, title, background, settings, affiliate FROM main_games ORDER BY LOWER(title)"
    );

    let games = result.rows.map(row => ({
      id: row.id,
      title: row.background?.title || row.title || row.id.replace(/-/g, " "),
      backgroundUrl: row.background?.thumbnail
        ? config.serverFullUrl + row.background.thumbnail
        : row.background?.url
        ? config.serverFullUrl + row.background.url
        : undefined,
      backgroundOpacity: row.background?.transparent || 0,
      titleColor: row.background?.color || 0,
      affiliate: row.affiliate || null
    }));

    c.put(config.mainGamePrefix + "all", games);
    console.log("PostgreSQL overview returned!");
    return games;
  } else {
    // Get specific game
    let cachedGame = c.get(config.mainGamePrefix + gamename);
    if (cachedGame) {
      console.log("Cached game returned!");
      return cachedGame;
    }

    const result = await database.query(
      "SELECT id, title, characters, tabs, background, settings, affiliate FROM main_games WHERE id = $1",
      [gamename]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const game = {
      id: row.id,
      characters: row.characters || [],
      background: row.background || {},
      settings: row.settings || {}
    };

    // Include tabs if the game uses tab structure
    if (row.tabs) {
      game.tabs = row.tabs;
    }

    if (row.affiliate) {
      game.affiliate = row.affiliate;
    }

    c.put(config.mainGamePrefix + gamename, game);
    console.log("PostgreSQL game returned!");
    return game;
  }
};

let deleteUserGame = async (accountInfoWithData, gameId) => {
  const result = await database.query(
    "DELETE FROM user_games WHERE id = $1 AND user_id = $2 RETURNING id",
    [gameId, accountInfoWithData.userId]
  );

  if (result.rows.length > 0) {
    userSetup.clearUserCache(accountInfoWithData.email);
    return { deleted: true };
  } else {
    return { error: "Could not find the game to delete!", deleted: false };
  }
};

let saveUserGame = async (accountInfoWithData, newData) => {
  let currentId = newData.id;

  if (!currentId) {
    // New save - generate ID
    currentId = config.userGameUUIDPrefix + uuid();
  } else if (
    !currentId.startsWith(config.userGameUUIDPrefix) &&
    !currentId.startsWith(config.mainGameUUIDPrefix)
  ) {
    currentId = config.mainGameUUIDPrefix + currentId + "---" + uuid();
  }

  newData.id = currentId;

  // Upsert the game
  await database.query(
    `INSERT INTO user_games (id, user_id, game_data, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (id) DO UPDATE SET game_data = $3, updated_at = NOW()`,
    [currentId, accountInfoWithData.userId, JSON.stringify(newData)]
  );

  userSetup.clearUserCache(accountInfoWithData.email);
  emailSetup.sendAdminEmail();

  // Return updated account info with all games
  const gamesResult = await database.query(
    "SELECT game_data FROM user_games WHERE user_id = $1",
    [accountInfoWithData.userId]
  );

  const data = gamesResult.rows.map(row => row.game_data);

  return {
    email: accountInfoWithData.email,
    token: accountInfoWithData.token,
    data: data,
    currentId: currentId
  };
};

let mainGameSetter = async (id, data) => {
  const gameData = typeof data === "string" ? JSON.parse(data) : data;
  const title = gameData.background?.title || id.replace(/-/g, " ");

  await database.query(
    `INSERT INTO main_games (id, title, characters, tabs, background, settings, affiliate, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (id) DO UPDATE SET
       title = $2,
       characters = $3,
       tabs = $4,
       background = $5,
       settings = $6,
       affiliate = $7,
       updated_at = NOW()`,
    [
      id,
      title,
      JSON.stringify(gameData.characters || []),
      gameData.tabs ? JSON.stringify(gameData.tabs) : null,
      JSON.stringify(gameData.background || {}),
      JSON.stringify(gameData.settings || {}),
      gameData.affiliate ? JSON.stringify(gameData.affiliate) : null
    ]
  );

  c = new Cache(config.cacheForMinutes);
  console.log("CACHE CLEARED!");
};

let mainGameDelete = async id => {
  await database.query("DELETE FROM main_games WHERE id = $1", [id]);
  c = new Cache(config.cacheForMinutes);
};

module.exports = {
  mainGameSetter,
  mainGameDelete,
  getMainGame,
  saveUserGame,
  deleteUserGame
};
