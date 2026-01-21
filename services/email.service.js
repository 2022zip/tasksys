const nodemailer = require("nodemailer");
const { env } = require("../config/env");
const { log, error } = require("../config/logger");

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE, // true for 465, false for other ports
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

/**
 * Send an email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} html - Email body (HTML)
 */
async function sendEmail(to, subject, html) {
  if (!env.SMTP_HOST || !env.SMTP_USER) {
    log("SMTP not configured, skipping email sending.");
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`, // sender address
      to: to, // list of receivers
      cc: env.SMTP_CC, // copy to
      subject: subject, // Subject line
      html: html, // html body
    });

    log(`Email sent: ${info.messageId}`);
    return info;
  } catch (err) {
    error("Error sending email:", err);
    throw err;
  }
}

/**
 * Send task assignment notification
 * @param {string} to - Recipient email
 * @param {object} task - Task object
 */
async function sendTaskAssignmentEmail(to, task) {
  const subject = `[任务分配] 新任务: ${task.title}`;
  const html = `
    <h2>您有一个新任务</h2>
    <p><strong>任务名称:</strong> ${task.title}</p>
    <p><strong>重点:</strong> ${task.keyPoint || '无'}</p>
    <p><strong>开始时间:</strong> ${task.startDate}</p>
    <p><strong>计划完成时间:</strong> ${task.plannedEndDate}</p>
    <p><strong>状态:</strong> ${task.status}</p>
    <br/>
    <p>请及时登录系统查看详情。</p>
  `;
  return sendEmail(to, subject, html);
}

module.exports = {
  sendEmail,
  sendTaskAssignmentEmail,
};
