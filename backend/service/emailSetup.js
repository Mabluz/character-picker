"use strict";
const { Resend } = require("resend");
const config = require("../config/config");
const database = require("./database");
const userService = require("./userSetup");

let lastSendAdminEmail = new Date().getTime();
const sendAdminEmail = async () => {
  let diff = new Date().getTime() - lastSendAdminEmail;
  if (diff > 1000 * 60 * 60 * 24) {
    // Every 24 hours
    console.log("Sending admin email!");
    lastSendAdminEmail = new Date().getTime();
    let backup = await userService.adminGetAllUsers(true);
    try {
      backup = JSON.stringify(backup);
    } catch (e) {
      backup = "ERROR!!!";
    }
    sendEmail(
      "marius_flagstad@hotmail.com",
      "randomboardgame - " + new Date(),
      backup,
      backup
    );
  }
};

const sendWelcome = userEmail => {
  const html =
    "<p>Welcome to Random Board Game!</p>" +
    "<p>Your account has been created and you're ready to start picking characters.</p>" +
    "<p>Visit us at <a href='https://randomboardgame.com'>randomboardgame.com</a></p>";

  const text =
    "Welcome to Random Board Game!\n\n" +
    "Your account has been created and you're ready to start picking characters.\n\n" +
    "Visit us at https://randomboardgame.com";

  sendEmail(userEmail, "Welcome to Random Board Game!", text, html);
};

const sendResetPassword = (userEmail, token) => {
  let url = config.emailLandingPagePasswordReset;
  let text =
    "A password change was requested for this email address. \r\n" +
    "To accept the request go to this url: " +
    url +
    "?e=" +
    userEmail +
    "&t=" +
    token +
    "\r\n" +
    "If this was not you then you can just ignore this email. Your old password will still work next time you try to enter.";

  let html =
    "<p>A password change was requested for this email address.</p>" +
    "<p>To accept the new password go to this url: <a href='" +
    url +
    "?e=" +
    userEmail +
    "&t=" +
    token +
    "'>" +
    url +
    "</a></p>" +
    "<p>If this was not you then you can just ignore this email. Your old password will still work next time you try to enter.</p>";

  sendEmail(userEmail, "New password reset", text, html);
};

const logSendError = async (recipient, subject, errorMessage, errorCode) => {
  try {
    await database.query(
      `INSERT INTO email_send_errors (recipient, subject, error_message, error_code)
       VALUES ($1, $2, $3, $4)`,
      [recipient, subject || null, errorMessage, errorCode || null]
    );
  } catch (e) {
    console.error("Failed to log email send error:", e);
  }
};

const sendEmail = async (emailTo, subject, text, html) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: config.emailFrom,
    to: emailTo,
    subject: subject,
    text: text,
    html: html
  });
  if (error) {
    console.error("Resend send error:", error);
    await logSendError(emailTo, subject, error.message || JSON.stringify(error), error.name);
  }
};

module.exports = {
  sendAdminEmail,
  sendEmail,
  logSendError,
  sendResetPassword,
  sendWelcome
};
