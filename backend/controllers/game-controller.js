"use strict";
const app = require("express");
const router = app.Router();
const cors = require("cors");
const config = require("../config/config");
const gameServer = require("../service/gameSetup");
const userServer = require("../service/userSetup");

router.get("/game", cors(), async (req, res, next) => {
  let games = await gameServer.getMainGame();
  res.json(games);
});

router.get("/game/:gamename", cors(), async (req, res, next) => {
  let games = await gameServer.getMainGame(req.params.gamename);
  res.json(games);
});

router.delete("/usergame/:gamename", cors(), async (req, res, next) => {
  let body = req.body;
  let userValid = await userServer.validateUser(body.email, body.token, false);
  if (userValid.login) {
    let gameSaved = await gameServer.deleteUserGame(
      userValid.data,
      decodeURIComponent(req.params.gamename)
    );
    if (gameSaved.error) res.status(401);
    return res.json(gameSaved);
  } else
    return res
      .status(401)
      .json({
        error: "User not logged in. Could not delete game!",
        deleted: false
      });
  return res.json({});
});

router.post("/usergame/:gamename", cors(), async (req, res, next) => {
  let body = req.body;
  let userValid = await userServer.validateUser(body.email, body.token, false);
  delete body.email;
  delete body.token;
  if (userValid.login) {
    let gameSaved = await gameServer.saveUserGame(userValid.data, body);
    return res.json(gameSaved);
  } else
    return res
      .status(401)
      .json({ error: "User not logged in. Could not save game!" });
  return res.json({});
});

router.put("/pushmaingames/:gamename", cors(), async (req, res, next) => {
  if (req.headers[config.customHeaderMainPush] !== config.authCodeForMainPush)
    return res.status(401).send("No access");

  let data = JSON.stringify(req.body);
  await gameServer.mainGameSetter(req.params.gamename, data);
  res.send("Data stored");
});

router.delete("/delmaingames/:gamename", cors(), async (req, res, next) => {
  if (req.headers[config.customHeaderMainPush] !== config.authCodeForMainPush)
    return res.status(401).send("No access");

  await gameServer.mainGameDelete(req.params.gamename);
  res.send("Data deleted");
});

module.exports = router;
