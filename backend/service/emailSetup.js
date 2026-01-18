"use strict";
const sgMail = require("@sendgrid/mail");
const config = require("../config/config");
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

const sendEmail = (emailTo, subject, text, html) => {
  sgMail.setApiKey(config.emailKey);
  const msg = {
    to: emailTo,
    from: config.emailFrom,
    subject: subject,
    text: text,
    html: html
  };
  sgMail.send(msg);
};

module.exports = {
  sendAdminEmail,
  sendEmail,
  sendResetPassword
};
