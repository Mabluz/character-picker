"use strict";
const app = require("express");
const router = app.Router();
const cors = require("cors");
const uuid = require("uuid");
const auth = require("http-auth");
const { Resend } = require("resend");
const config = require("../config/config");
const database = require("../service/database");
const userService = require("../service/userSetup");
const gameService = require("../service/gameSetup");

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

// Middleware: verify user token and is_admin flag
const requireAdmin = async (req, res, next) => {
  try {
    const email = req.query.email || (req.body && req.body.email);
    const token = req.query.token || (req.body && req.body.token);
    if (!email || !token) return res.status(401).json({ error: "Unauthorized" });
    const result = await userService.validateUser(email, token, false);
    if (!result.login || !result.data || !result.data.isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }
    req.adminUser = result.data;
    next();
  } catch (e) {
    console.error("requireAdmin error:", e);
    res.status(500).json({ error: "Auth check failed: " + e.message });
  }
};

// ── JSON API routes (used by frontend admin page) ──────────────────────────

router.get("/api/users", cors(), requireAdmin, async (req, res) => {
  const users = await userService.adminGetAllUsers();
  res.json(users);
});

router.patch("/api/users/:id/admin", cors(), requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);
  const isAdmin = req.body.isAdmin === true || req.body.isAdmin === "true";
  if (isNaN(userId)) return res.status(400).json({ error: "Invalid user id" });
  await userService.setUserAdmin(userId, isAdmin);
  res.json({ ok: true });
});

router.patch("/api/users/:id/blocked", cors(), requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id);
  const isBlocked = req.body.isBlocked === true || req.body.isBlocked === "true";
  if (isNaN(userId)) return res.status(400).json({ error: "Invalid user id" });
  await userService.setUserBlocked(userId, isBlocked);
  res.json({ ok: true });
});

router.get("/api/backup", cors(), requireAdmin, async (req, res) => {
  const data = await userService.adminGetAllUsers(true);
  res.json(data);
});

// ── Games routes ──────────────────────────────────────────────────────────

// All user-created games (with owner email)
router.get("/api/games/user", cors(), requireAdmin, async (req, res) => {
  try {
    const result = await database.query(
      `SELECT ug.id, ug.game_data, ug.created_at, ug.updated_at, u.email as owner_email
       FROM user_games ug
       JOIN users u ON ug.user_id = u.id
       ORDER BY ug.updated_at DESC`
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// All pre-set (main) games — full data
router.get("/api/games/main", cors(), requireAdmin, async (req, res) => {
  try {
    const result = await database.query(
      `SELECT id, title, characters, tabs, background, settings, affiliate, created_at, updated_at
       FROM main_games
       ORDER BY LOWER(title)`
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Email log routes ───────────────────────────────────────────────────────

router.get("/api/emails", cors(), requireAdmin, async (req, res) => {
  try {
    if (!process.env.RESEND_API_KEY) {
      return res.status(500).json({ error: "RESEND_API_KEY is not set in environment" });
    }
    const resend = new Resend(process.env.RESEND_API_KEY);
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const params = { limit };
    if (req.query.after) params.after = req.query.after;
    const result = await resend.emails.list(params);
    if (result.error) {
      console.error("Resend list error:", result.error);
      return res.status(500).json({ error: result.error.message, code: result.error.name, statusCode: result.error.statusCode });
    }
    res.json(result.data);
  } catch (e) {
    console.error("emails list exception:", e);
    res.status(500).json({ error: e.message });
  }
});

router.get("/api/email-errors", cors(), requireAdmin, async (req, res) => {
  try {
    const clearedAt = await getEmailAlertsCleared();
    const result = await database.query(
      `SELECT *, created_at > $1 AS is_new
       FROM email_send_errors
       ORDER BY created_at DESC
       LIMIT 200`,
      [clearedAt]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/api/email-errors/count", cors(), requireAdmin, async (req, res) => {
  try {
    const clearedAt = await getEmailAlertsCleared();
    const result = await database.query(
      `SELECT COUNT(*) FROM email_send_errors WHERE created_at > $1`,
      [clearedAt]
    );
    res.json({ count: parseInt(result.rows[0].count), cleared_at: clearedAt });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/api/email-errors/clear", cors(), requireAdmin, async (req, res) => {
  try {
    const now = new Date().toISOString();
    await database.query(
      `INSERT INTO admin_config (key, value, updated_at)
       VALUES ('email_alerts_cleared_at', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [now]
    );
    res.json({ cleared_at: now });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const getEmailAlertsCleared = async () => {
  const result = await database.query(
    `SELECT value FROM admin_config WHERE key = 'email_alerts_cleared_at'`
  );
  return result.rows.length > 0 ? result.rows[0].value : new Date(0).toISOString();
};

// ── Legacy HTML routes (basic auth, kept for backward compatibility) ────────

router.get("/users", auth.connect(basic), async (req, res, next) => {
  let users = await userService.adminGetAllUsers();
  allUsers = users;
  uuidDownload = uuid();
  let html =
    "<html><head></head><body>" +
    "<h1>All users</h1>" +
    "<table>" +
    "<th>Email</th>" +
    "<th>Admin</th>" +
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
    html += "<td>" + (user.isAdmin ? "YES" : "") + "</td>";
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
