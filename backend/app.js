"use strict";
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const database = require("./service/database");

let server = express();
server.use(cors());

server.use(bodyParser.json()); // for parsing application/json
server.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
server.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (
    req.url.endsWith(".jpg") ||
    req.url.endsWith(".png") ||
    req.url.endsWith(".jpeg") ||
    req.url.endsWith(".bmp") ||
    req.url.endsWith(".svg") ||
    req.url.endsWith(".webp")
  )
    res.header("Cache-Control", "max-age=" + 60 * 60 * 2); // 2 hours
  next();
});

server.use(express.static(process.env.GAMES_DIR || path.join(__dirname, "games")));

server.use("/adminview", require("./controllers/admin-controller"));
server.use("/email", require("./controllers/email-controller"));
server.use("/user", require("./controllers/user-controller"));
server.use("/", require("./controllers/game-controller"));

const startServer = async () => {
  try {
    // Initialize database (runs migrations and auto-loads games)
    await database.init();

    if (!process._eval) {
      let portUsed = process.env.PORT || 1337;
      server.listen(portUsed, function () {
        console.log("HTTP server started at port " + portUsed);
      });
    }
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
