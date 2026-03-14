// server.js
var express = require("express");
var path = require("path");
var http = require("http");
var serveStatic = require("serve-static");
var app = express();
app.use(serveStatic(__dirname + "/dist"));
app.get("/sitemap.xml", (req, res) => {
  http.get("http://localhost:1337/sitemap.xml", proxyRes => {
    res.header("Content-Type", "application/xml");
    proxyRes.pipe(res);
  }).on("error", () => res.status(502).send("Sitemap unavailable"));
});
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname + "/dist/index.html"));
});
var port = process.env.PORT || 5000;
app.listen(port);
console.log("server started " + port);
