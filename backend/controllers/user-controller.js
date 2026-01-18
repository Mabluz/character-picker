"use strict";
const app = require("express");
const router = app.Router();
const cors = require("cors");
const config = require("../config/config");
const userServer = require("../service/userSetup");

/*
router.get("*", cors(), async (req, res, next) => {
let returnedData = await redisServer.getter();
try {
    returnedData = JSON.parse(returnedData);
} catch (e) {
    console.log("Parse error: ", e);
    returnedData = { error: "Parse error" };
}
res.json(returnedData);
});
*/

let validateUserAndEmail = (req, res, validateRepeat = false) => {
  let body = req.body;
  if (!body) {
    res.status(500).json({ error: "No body set" });
    return false;
  }
  let userName = body.email;
  if (!userName) {
    res.status(500).json({ error: "No username set" });
    return false;
  }

  let re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!re.test(userName)) {
    res.status(500).json({ error: "Unvalid email address" });
    return false;
  }
  let userPass = body.password;
  if (!userPass) {
    res.status(500).json({ error: "No password set" });
    return false;
  }
  if (validateRepeat) {
    let userPassRepeat = body.repeat;
    if (!userPassRepeat) {
      res.status(500).json({ error: "No repeat password set" });
      return false;
    }
    if (userPassRepeat !== userPass) {
      res
        .status(500)
        .json({ error: "Repeated password does not match password" });
      return false;
    }
  }
  return true;
};

router.post("/validate", cors(), async (req, res, next) => {
  let body = req.body;
  let email = body && body.email ? body.email : undefined;
  let token = body && body.token ? body.token : undefined;
  let userLogin = await userServer.validateUser(email, token);
  return res.json(userLogin);
});

router.post("/login", cors(), async (req, res, next) => {
  if (!validateUserAndEmail(req, res)) return;

  let body = req.body;
  let userKey = userServer.generateUserKey(body.email, body.password);
  let userAccuout = await userServer.getUserAccount(body.email);

  if (userAccuout.error) return res.status(500).json(userAccuout);
  if (userKey !== userAccuout.userKey)
    return res.status(500).json({ error: "Incorrect password" });

  let user = await userServer.newLogin(userAccuout);
  return res.json(user);
});

router.post("/signup", cors(), async (req, res, next) => {
  if (!validateUserAndEmail(req, res, true)) return;

  let body = req.body;
  let userAccuout = await userServer.getUserAccount(body.email);
  if (userAccuout.error) {
    let answer = await userServer.signUpUser(body.email, body.password);
    return res.json(answer);
  } else if (!userAccuout.error) {
    return res.status(500).json({
      error: "Email already signed up"
    });
  }
});

router.post("/resetpassword", cors(), async (req, res, next) => {
  if (!validateUserAndEmail(req, res, true)) return;

  let body = req.body;
  let userAccuout = await userServer.getUserAccount(body.email);
  if (userAccuout.error) {
    return res.status(500).json(userAccuout);
    /*
        {error: 'Email not found'}
         */
  } else {
    let answer = await userServer.resetPassword(
      userAccuout,
      body.email,
      body.password
    );
    return res.json(answer);
  }
});

router.post("/validatepasswordreset", cors(), async (req, res, next) => {
  let body = req.body;
  if (!body)
    return res.status(500).json({ error: "No body found on the request" });
  let email = body.email;
  if (!email)
    return res.status(500).json({ error: "No email found on the request" });
  let token = body.token;
  if (!token)
    return res.status(500).json({ error: "No token found on the request" });

  let userAccuout = await userServer.getUserAccount(email);
  if (userAccuout.error) return res.status(500).json(userAccuout);
  else if (!userAccuout.newUserData)
    return res.status(500).json({ error: "No password request found" });
  else if (!userAccuout.newUserData.token)
    return res
      .status(500)
      .json({ error: "No token on the password request found" });
  else if (userAccuout.newUserData.token !== token)
    return res
      .status(500)
      .json({ error: "Token did not match the password request initiated" });
  else {
    let answer = await userServer.preformPasswordReset(userAccuout, email);
    return res.json(answer);
  }
});

module.exports = router;
