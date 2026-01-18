"use strict";
const app = require("express");
const router = app.Router();
const cors = require("cors");

const config = require("../config/config");

router.get("/send", cors(), async (req, res, next) => {});

module.exports = router;
