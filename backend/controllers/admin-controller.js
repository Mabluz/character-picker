"use strict";
const app = require("express");
const router = app.Router();
const cors = require("cors");
const uuid = require("uuid");
const auth = require("http-auth");
const config = require("../config/config");
const userService = require("../service/userSetup");

let basic = auth.basic({ realm: "Web." }, function(
  username,
  password,
  callback
) {
  callback(
    username === config.adminAuthUser && password === config.adminAuthPass
  );
});
let basicDownload = auth.basic({ realm: "Web." }, function(
  username,
  password,
  callback
) {
  callback(
    username === config.adminAuthUser2 && password === config.adminAuthPass2
  );
});

let allUsers;
let uuidDownload;

router.get("/users", auth.connect(basic), async (req, res, next) => {
  let users = await userService.adminGetAllUsers();
  allUsers = users;
  uuidDownload = uuid();
  let html =
    "<html><head></head><body>" +
    "<h1>All users</h1>" +
    "<table>" +
    "<th>Email</th>" +
    "<th>Games</th>" +
    "<th>Game names</th>" +
    "<th>Last login</th>" +
    "</tr>";
  users.forEach(user => {
    let games = user.data ? user.data.length : 0;
    let gamesError = "";
    if (!user.data && user.error) {
      games = "Error";
      gamesError = user.error;
    }

    let gamesInfo = user.data
      ? user.data.map(d => {
          return d.id;
        })
      : [];
    html += "<tr>";
    html += "<td>" + user.email + "</a></td>";
    html += "<td>" + games + "</td>";
    html += "<td>";
    html += gamesError;
    gamesInfo.forEach(gInfo => {
      html +=
        '<p><a href="' + user.uuid + "/" + gInfo + '">' + gInfo + "</a></p>";
    });
    html += "</td>";
    html += "<td>" + new Date(user.tokenTime) + "</td>";
    html += "</tr>";
  });
  html += "</table>";
  html +=
    '<form method="get" action="download/' +
    uuidDownload +
    '.json"><button>Download backup</button></form>' +
    "<style type='text/css'>" +
    "table td, table th { text-align:left; padding: 10px; border-top: 1px solid black; }" +
    "table { border-bottom: 1px solid black }" +
    "p { margin: 5px }" +
    "button { margin-top: 25px }" +
    "</style>";
  ("</body></html>");
  res.send(html);
});

router.get(
  "/download/:id",
  auth.connect(basicDownload),
  async (req, res, next) => {
    if (req.params.id === uuidDownload + ".json")
      return res.json(await userService.adminGetAllUsers(true));
    return res.send("Error");
  }
);

router.get("/:userid/:gameid", auth.connect(basic), async (req, res, next) => {
  if (allUsers.constructor !== Array) return res.send("No games loaded");
  let game;
  allUsers.forEach(user => {
    if (user.uuid === req.params.userid) {
      user.data.forEach(g => {
        if (g.id === req.params.gameid) game = g;
      });
    }
  });
  res.json(game);
});

module.exports = router;
