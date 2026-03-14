// server.js
var express = require("express");
var path = require("path");
var axios = require("axios");
var serveStatic = require("serve-static");
var app = express();

var BACKEND_URL = process.env.BACKEND_INTERNAL_URL || "https://randomboardgame.com/api";
var BASE_URL = process.env.BASE_URL || "https://randomboardgame.com";

app.use(serveStatic(__dirname + "/dist"));

app.get("/sitemap.xml", async (req, res) => {
  try {
    var response = await axios.get(BACKEND_URL + "/game");
    var games = response.data;

    var urls = [
      { loc: BASE_URL + "/", priority: "1.0" },
      { loc: BASE_URL + "/donate", priority: "0.3" }
    ].concat(games.map(g => ({ loc: BASE_URL + "/game/" + g.id, priority: "0.8" })));

    var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + urls.map(u => "  <url>\n    <loc>" + u.loc + "</loc>\n    <priority>" + u.priority + "</priority>\n  </url>").join("\n")
      + "\n</urlset>";

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (e) {
    res.status(502).send("Sitemap unavailable");
  }
});
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/dist/index.html"));
});
var port = process.env.PORT || 5000;
app.listen(port);
console.log("server started " + port);
