"use strict";
const app = require("express");
const router = app.Router();
const cors = require("cors");

const config = require("../config/config");
const emailSetup = require("../service/emailSetup");

router.get("/send", cors(), async (req, res, next) => {});

router.post("/report", cors(), async (req, res) => {
  const { description, email, game } = req.body;

  if (!description || description.trim() === "") {
    return res.status(400).json({ error: "Description is required" });
  }

  const to = process.env.REPORT_GAME_DATA_EMAIL_TO;
  if (!to) {
    return res.status(500).json({ error: "Report email not configured" });
  }

  const gameName = game ? game.trim() : "Unknown game";
  const subject = "Game data report: " + gameName + " - randomboardgame";
  const text =
    "A user reported a data issue.\n\n" +
    "Game: " + gameName + "\n\n" +
    "Description:\n" + description.trim() + "\n\n" +
    (email ? "User email: " + email.trim() : "No email provided");
  const html =
    "<p><strong>A user reported a data issue.</strong></p>" +
    "<p><strong>Game:</strong> " + gameName + "</p>" +
    "<p><strong>Description:</strong></p>" +
    "<p>" + description.trim().replace(/\n/g, "<br>") + "</p>" +
    (email ? "<p><strong>User email:</strong> " + email.trim() + "</p>" : "<p>No email provided</p>");

  await emailSetup.sendEmail(to, subject, text, html);

  return res.json({ success: true });
});

module.exports = router;
