
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const getBrevoConfig = () => {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const fromEmail = process.env.BREVO_FROM_EMAIL?.trim();

  if (!apiKey || !fromEmail) {
    throw new Error("BREVO_API_KEY or BREVO_FROM_EMAIL is missing.");
  }

  return { apiKey, fromEmail };
};

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);

const sendEmail = async ({
  to,
  subject,
  html,
  text,
  replyTo,
  senderName = "RentGuard",
}) => {
  const { apiKey, fromEmail } = getBrevoConfig();

  if (!to) throw new Error("Recipient email is required.");

  const payload = {
    sender: {
      name: senderName,
      email: fromEmail,
    },
    to: [{ email: to }],
    subject,
  };

  if (html) payload.htmlContent = html;
  if (text) payload.textContent = text;

  if (replyTo) {
    payload.replyTo = { email: replyTo };
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Brevo email API error:", result);
    throw new Error(
      result.message || `Brevo email failed with status ${response.status}`
    );
  }

  console.log("Email sent through Brevo:", result.messageId);

  return {
    ...result,
    messageId: result.messageId,
  };
};

// ==========================================
// 1. OTP EMAIL
// ==========================================

export const sendOtpEmail = async (email, otp) => {
  try {
    return await sendEmail({
      to: email,
      subject: "Your RentGuard Login OTP",
      html: `
        <div style="font-family:Arial;max-width:500px;margin:auto;padding:25px;">
          <h2 style="color:#d4a017;">RentGuard</h2>
          <h3>Your Login OTP</h3>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing:8px;">${escapeHtml(otp)}</h1>
          <p>This OTP expires in 5 minutes.</p>
          <p>Do not share this code with anyone.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("OTP email sending failed:", error.message);
    throw new Error("Unable to send OTP email.");
  }
};

// ==========================================
// 2. MAINTENANCE NOTIFICATION EMAIL
// ==========================================

export const sendMaintenanceEmail = async ({
  ownerEmail,
  ownerName,
  tenantName,
  propertyName,
  unitName,
  title,
  category,
  priority,
  description,
}) => {
  try {
    if (!ownerEmail) return null;

    const priorityColor =
      priority === "High"
        ? "#dc2626"
        : priority === "Medium"
        ? "#d97706"
        : "#16a34a";

    return await sendEmail({
      to: ownerEmail,
      senderName: "RentGuard Maintenance",
      subject: `[Maintenance Alert] ${priority} Priority: ${title}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;border:1px solid #e5e5e5;border-radius:8px;">
          <h2 style="color:#d4a017;margin-top:0;">RentGuard Maintenance Alert</h2>
          <p>Hello ${escapeHtml(ownerName || "Property Owner")},</p>
          <p>A new maintenance complaint has been posted by tenant
            <strong>${escapeHtml(tenantName)}</strong>.
          </p>

          <div style="background-color:#f9f9f9;padding:15px;border-radius:6px;margin:15px 0;">
            <p><strong>Property:</strong> ${escapeHtml(propertyName || "N/A")}</p>
            <p><strong>Unit:</strong> ${escapeHtml(unitName || "N/A")}</p>
            <p><strong>Title:</strong> ${escapeHtml(title)}</p>
            <p><strong>Category:</strong> ${escapeHtml(category)}</p>
            <p><strong>Priority:</strong>
              <span style="color:${priorityColor};font-weight:bold;">
                ${escapeHtml(priority)}
              </span>
            </p>
            <p><strong>Description:</strong></p>
            <p style="white-space:pre-line;color:#374151;">
              ${escapeHtml(description)}
            </p>
          </div>

          <p style="color:#6b7280;font-size:13px;">
            Please log in to your RentGuard owner portal to review and manage this request.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Maintenance notification email failed:", error.message);
    return null;
  }
};

// ==========================================
// 3. TENANCY AND MOVE-OUT NOTIFICATIONS
// ==========================================

export const sendTenancyNotificationEmails = async ({
  event,
  tenantEmail,
  tenantName,
  ownerEmail,
  ownerName,
  propertyName,
  propertyAddress,
  unitName,
  rent,
  requestedAt,
  expiresAt,
  reviewedAt,
  bills = [],
}) => {
  try {
    const date = (value) =>
      value
        ? new Date(value).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "N/A";

    const amount = (value) =>
      `₹${Number(value || 0).toLocaleString("en-IN")}`;

    const templates = {
      registered: {
        subject: "Welcome to RentGuard - Tenant Registration Successful",
        heading: "Tenant Registration Successful",
        tenantMessage: `Hello ${escapeHtml(tenantName)}, your tenancy has been successfully registered on RentGuard.`,
        ownerMessage: `Hello ${escapeHtml(ownerName)}, tenant ${escapeHtml(tenantName)} has been successfully registered.`,
      },
      requested: {
        subject: "RentGuard - Move-out Request Submitted",
        heading: "Move-out Request Submitted",
        tenantMessage:
          "Your move-out request has been successfully submitted to your property owner.",
        ownerMessage: `${escapeHtml(tenantName)} has submitted a move-out request. Please log in to your owner dashboard to review it.`,
      },
      approved: {
        subject: "RentGuard - Move-out Request Approved",
        heading: "Move-out Request Approved",
        tenantMessage:
          "Your move-out request has been approved. Your tenancy has now ended.",
        ownerMessage: `The move-out request for ${escapeHtml(tenantName)} has been approved successfully.`,
      },
      rejected: {
        subject: "RentGuard - Move-out Request Rejected",
        heading: "Move-out Request Rejected",
        tenantMessage:
          "Your move-out request was rejected because some bills are unpaid or pending. Please clear your outstanding bills before submitting another request. You may submit a new request immediately.",
        ownerMessage: `The move-out request for ${escapeHtml(tenantName)} was rejected because unpaid or pending bills were found.`,
      },
    };

    const template = templates[event];

    if (!template) {
      throw new Error(`Unsupported tenancy email event: ${event}`);
    }

    const billRows = bills.length
      ? `
        <h3>Outstanding Bills</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">Bill</th>
            <th style="text-align:left;padding:8px;border-bottom:1px solid #ddd;">Status</th>
            <th style="text-align:right;padding:8px;border-bottom:1px solid #ddd;">Amount</th>
          </tr>
          ${bills
            .map(
              (bill) => `
                <tr>
                  <td style="padding:8px;border-bottom:1px solid #eee;">
                    ${escapeHtml(bill.billName)}
                  </td>
                  <td style="padding:8px;border-bottom:1px solid #eee;">
                    ${escapeHtml(bill.paymentStatus)}
                  </td>
                  <td style="padding:8px;text-align:right;">
                    ${amount(bill.amount)}
                  </td>
                </tr>
              `
            )
            .join("")}
        </table>
      `
      : "";

    const details = `
      <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:20px 0;">
        <p><strong>Tenant:</strong> ${escapeHtml(tenantName)}</p>
        <p><strong>Property:</strong> ${escapeHtml(propertyName)}</p>
        <p><strong>Address:</strong> ${escapeHtml(propertyAddress)}</p>
        <p><strong>Unit:</strong> ${escapeHtml(unitName)}</p>
        ${rent !== undefined ? `<p><strong>Monthly Rent:</strong> ${amount(rent)}</p>` : ""}
        ${requestedAt ? `<p><strong>Requested At:</strong> ${date(requestedAt)}</p>` : ""}
        ${expiresAt ? `<p><strong>Request Expires:</strong> ${date(expiresAt)}</p>` : ""}
        ${reviewedAt ? `<p><strong>Reviewed At:</strong> ${date(reviewedAt)}</p>` : ""}
      </div>
      ${billRows}
    `;

    const baseStyle = `
      font-family:Arial,sans-serif;
      max-width:600px;
      margin:auto;
      padding:25px;
      color:#333;
      line-height:1.6;
    `;

    const emails = [];

    if (tenantEmail) {
      emails.push(
        sendEmail({
          to: tenantEmail,
          subject: template.subject,
          html: `
            <div style="${baseStyle}">
              <h2 style="color:#d4a017;">RentGuard</h2>
              <h3>${template.heading}</h3>
              <p>${template.tenantMessage}</p>
              ${details}
              <p>Thank you for using RentGuard.</p>
            </div>
          `,
        })
      );
    }

    if (ownerEmail) {
      emails.push(
        sendEmail({
          to: ownerEmail,
          subject: template.subject,
          html: `
            <div style="${baseStyle}">
              <h2 style="color:#d4a017;">RentGuard</h2>
              <h3>${template.heading}</h3>
              <p>${template.ownerMessage}</p>
              ${details}
              <p>Please log in to your RentGuard dashboard to manage your property.</p>
            </div>
          `,
        })
      );
    }

    const results = await Promise.allSettled(emails);

    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Tenancy notification email failed:", result.reason);
      }
    });

    return results;
  } catch (error) {
    console.error("Tenancy notification email error:", error);
    return null;
  }
};

// ==========================================
// 4. PAYMENT CONFIRMATION EMAILS
// ==========================================

export const sendPaymentConfirmationEmails = async ({
  tenantEmail,
  tenantName,
  ownerEmail,
  ownerName,
  propertyName,
  propertyAddress,
  unitName,
  amount,
  paymentId,
  receiptNumber,
  paidAt,
  bills = [],
}) => {
  try {
    const formatAmount = (value) =>
      `₹${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const formattedDate = new Date(paidAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const billRows = bills
      .map(
        (bill, index) => `
          <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;">
              ${index + 1}. ${escapeHtml(bill.billName)}
            </td>
            <td style="padding:10px;border-bottom:1px solid #eee;">
              ${escapeHtml(bill.category)}
            </td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">
              ${formatAmount(bill.amount)}
            </td>
          </tr>
        `
      )
      .join("");

    const details = `
      <div style="background:#f8fafc;padding:18px;border-radius:8px;margin:20px 0;">
        <p><strong>Property:</strong> ${escapeHtml(propertyName)}</p>
        <p><strong>Address:</strong> ${escapeHtml(propertyAddress)}</p>
        <p><strong>Unit:</strong> ${escapeHtml(unitName)}</p>
        <p><strong>Payment date:</strong> ${escapeHtml(formattedDate)}</p>
        <p><strong>Payment ID:</strong> ${escapeHtml(paymentId)}</p>
        <p><strong>Receipt number:</strong> ${escapeHtml(receiptNumber)}</p>

        <table style="width:100%;border-collapse:collapse;margin-top:15px;">
          <thead>
            <tr style="background:#eee;">
              <th style="padding:10px;text-align:left;">Bill</th>
              <th style="padding:10px;text-align:left;">Category</th>
              <th style="padding:10px;text-align:right;">Amount</th>
            </tr>
          </thead>
          <tbody>${billRows}</tbody>
        </table>

        <h3 style="text-align:right;color:#15803d;">
          Total Received: ${formatAmount(amount)}
        </h3>
        <p style="color:#15803d;font-weight:bold;">Payment Status: SUCCESSFUL</p>
      </div>
    `;

    const baseStyle = `
      font-family:Arial,sans-serif;
      max-width:650px;
      margin:auto;
      padding:25px;
      color:#333;
    `;

    const emails = [];

    if (tenantEmail) {
      emails.push(
        sendEmail({
          to: tenantEmail,
          subject: "RentGuard - Bill Payment Successful",
          html: `
            <div style="${baseStyle}">
              <h2 style="color:#d4a017;">RentGuard</h2>
              <h3 style="color:#15803d;">Payment Successful!</h3>
              <p>Hello ${escapeHtml(tenantName)},</p>
              <p>Your bill payment has been successfully received and verified.</p>
              ${details}
              <p>Thank you for using RentGuard.</p>
            </div>
          `,
        })
      );
    }

    if (ownerEmail) {
      emails.push(
        sendEmail({
          to: ownerEmail,
          senderName: "RentGuard Payments",
          subject: "RentGuard - Tenant Payment Received",
          html: `
            <div style="${baseStyle}">
              <h2 style="color:#d4a017;">RentGuard</h2>
              <h3 style="color:#15803d;">Payment Received!</h3>
              <p>Hello ${escapeHtml(ownerName || "Property Owner")},</p>
              <p>A bill payment has been successfully received from
                <strong>${escapeHtml(tenantName)}</strong>.
              </p>
              ${details}
              <p>This payment has been recorded in your RentGuard account.</p>
            </div>
          `,
        })
      );
    }

    const results = await Promise.allSettled(emails);

    results.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Payment confirmation email failed:", result.reason);
      }
    });

    return results;
  } catch (error) {
    console.error("Payment confirmation email error:", error);
    return null;
  }
};

// ==========================================
// 5. CONTACT FORM EMAIL
// ==========================================

export const sendContactEmail = async ({
  name,
  email,
  topic,
  message,
}) => {
  return await sendEmail({
    to: "singh2harneet@gmail.com",
    replyTo: email,
    senderName: "RentGuard Contact",
    subject: `[RentGuard Contact] ${topic}`,
    text: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Topic: ${topic}`,
      "",
      "Message:",
      message,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;">
        <h2 style="color:#d4a017;">New RentGuard Contact Enquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Topic:</strong> ${escapeHtml(topic)}</p>
        <hr />
        <h3>Message</h3>
        <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
    `,
  });
};
