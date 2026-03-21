"use strict";
const app = require("express");
const router = app.Router();
const cors = require("cors");
const config = require("../config/config");
const userServer = require("../service/userSetup");
const emailService = require("../service/emailSetup");
const database = require("../service/database");
const uuid = require("uuid");
const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(config.googleClientId);

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
  if (userAccuout.isBlocked)
    return res.status(403).json({ error: "This account has been blocked." });
  if (userKey !== userAccuout.userKey)
    return res.status(500).json({ error: "Incorrect password" });
  if (!userAccuout.emailVerified) {
    return res
      .status(403)
      .json({
        error: "Please verify your email before logging in.",
        unverified: true
      });
  }

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

router.post("/google-login", cors(), async (req, res, next) => {
  const credential = req.body && req.body.credential;
  if (!credential)
    return res.status(400).json({ error: "No Google credential provided" });

  try {
    const result = await userServer.googleLoginOrCreate(credential);
    if (result.error) return res.status(403).json(result);
    return res.json(result);
  } catch (e) {
    console.error("Google login error:", e.message);
    return res.status(500).json({ error: "Google login failed" });
  }
});

router.post("/local-login", cors(), async (req, res, next) => {
  const localToken = req.body && req.body.localToken;
  if (!localToken)
    return res.status(400).json({ error: "No localToken provided" });

  try {
    let user = await userServer.getUserAccountByLocalToken(localToken);
    if (user.error) {
      // Create new local user
      const token = uuid();
      const tokenTime = new Date().getTime();
      await database.query(
        `INSERT INTO users (email, user_key, google_id, local_token, token, token_time)
         VALUES (NULL, NULL, NULL, $1, $2, $3)`,
        [localToken, token, tokenTime]
      );
      user = await userServer.getUserAccountByLocalToken(localToken);
    }
    if (user.isBlocked)
      return res.status(403).json({ error: "This account has been blocked." });
    const result = await userServer.newLogin(user);
    return res.json(result);
  } catch (e) {
    console.error("Local login error:", e.message);
    return res.status(500).json({ error: "Local login failed" });
  }
});

router.post("/link-google", cors(), async (req, res, next) => {
  const { localToken, credential } = req.body || {};
  if (!localToken)
    return res.status(400).json({ error: "No localToken provided" });
  if (!credential)
    return res.status(400).json({ error: "No Google credential provided" });

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId
    });
    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();

    const localUser = await userServer.getUserAccountByLocalToken(localToken);
    if (localUser.error)
      return res.status(404).json({ error: "Local user not found" });
    if (localUser.isBlocked)
      return res.status(403).json({ error: "This account has been blocked." });

    // Check if this Google account already has a full account (by google_id or email)
    let existingByGoogleId = await userServer.getUserAccountByGoogleId(
      googleId
    );
    let existingByEmail = existingByGoogleId.error
      ? await userServer.getUserAccount(email)
      : null;
    const existingAccount = !existingByGoogleId.error
      ? existingByGoogleId
      : existingByEmail && !existingByEmail.error
      ? existingByEmail
      : null;

    if (existingAccount) {
      // Merge: transfer local user's games into the existing account, then delete the local user
      await database.query(
        `UPDATE user_games SET user_id = $1 WHERE user_id = $2`,
        [existingAccount.userId, localUser.userId]
      );
      await database.query(`DELETE FROM users WHERE id = $1`, [
        localUser.userId
      ]);
      // Ensure google_id is set on the existing account
      await database.query(
        `UPDATE users SET google_id = $1, updated_at = NOW() WHERE id = $2`,
        [googleId, existingAccount.userId]
      );
      userServer.clearUserCache(existingAccount.email);
      const merged = await userServer.getUserAccount(email);
      const result = await userServer.newLogin(merged);
      return res.json(result);
    }

    // No existing account — upgrade local user to Google account
    await database.query(
      `UPDATE users SET email = $1, google_id = $2, local_token = NULL, updated_at = NOW() WHERE id = $3`,
      [email, googleId, localUser.userId]
    );

    const updated = await userServer.getUserAccount(email);
    const result = await userServer.newLogin(updated);
    return res.json(result);
  } catch (e) {
    console.error("Link Google error:", e.message);
    return res.status(500).json({ error: "Failed to link Google account" });
  }
});

router.post("/link-email", cors(), async (req, res, next) => {
  const { localToken, email, password, repeat } = req.body || {};
  if (!localToken)
    return res.status(400).json({ error: "No localToken provided" });
  if (!email) return res.status(400).json({ error: "No email provided" });
  if (!password) return res.status(400).json({ error: "No password provided" });
  if (!repeat)
    return res.status(400).json({ error: "No repeat password provided" });
  if (password !== repeat)
    return res.status(400).json({ error: "Passwords do not match" });
  if (password.length < 6)
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });

  const emailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!emailRe.test(email))
    return res.status(400).json({ error: "Invalid email address" });

  try {
    // Guard: check email not already taken
    const existing = await userServer.getUserAccount(email);
    if (!existing.error) {
      return res
        .status(409)
        .json({ error: "This email is already registered." });
    }

    const user = await userServer.getUserAccountByLocalToken(localToken);
    if (user.error)
      return res.status(404).json({ error: "Local user not found" });
    if (user.isBlocked)
      return res.status(403).json({ error: "This account has been blocked." });

    const userKey = userServer.generateUserKey(email, password);
    const verificationToken = uuid();
    await database.query(
      `UPDATE users SET email = $1, user_key = $2, local_token = NULL,
       email_verified = false, email_verification_token = $3, updated_at = NOW()
       WHERE id = $4`,
      [email.toLowerCase().trim(), userKey, verificationToken, user.userId]
    );

    emailService.sendEmailVerification(
      email.toLowerCase().trim(),
      verificationToken
    );
    return res.json({
      answer: {
        unverified: true,
        email: email.toLowerCase().trim(),
        message: "Check your email to verify your account."
      }
    });
  } catch (e) {
    console.error("Link email error:", e.message);
    return res.status(500).json({ error: "Failed to link email account" });
  }
});

router.delete("/local-account", cors(), async (req, res, next) => {
  const token = req.body && req.body.token;
  if (!token) return res.status(400).json({ error: "No token provided" });

  try {
    // Only delete if it's actually a local user (has local_token, no email)
    const result = await database.query(
      `DELETE FROM users WHERE token = $1 AND email IS NULL AND local_token IS NOT NULL
       RETURNING id`,
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Local account not found" });
    }
    return res.json({ deleted: true });
  } catch (e) {
    console.error("Delete local account error:", e.message);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

router.post("/verify-email", cors(), async (req, res, next) => {
  const { token } = req.body || {};
  if (!token) return res.status(400).json({ error: "No token provided" });
  const result = await userServer.verifyEmailToken(token);
  if (result.error) return res.status(400).json(result);
  return res.json(result);
});

router.post("/resend-verification", cors(), async (req, res, next) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "No email provided" });
  const result = await userServer.resendVerificationEmail(email);
  if (result.error) return res.status(400).json(result);
  return res.json(result);
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
