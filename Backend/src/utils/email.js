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
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

const getLoginUrl = () => `${(process.env.FRONTEND_URL || "https://rent-guard-1.vercel.app").trim().replace(/\/+$/, "")}/login`;
const loginButtonHtml = () => { const url = getLoginUrl(); return `<div style="text-align:center;margin:24px 0;"><a href="${url}" style="background:#facc15;color:#111827;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">Log in to RentGuard</a></div><p style="font-size:13px;color:#6b7280;">Or open this link: <a href="${url}">${url}</a></p>`; };

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
      result.message || `Brevo email failed with status ${response.status}`,
    );
  }

  console.log("Email sent through Brevo:", result.messageId);

  return {
    ...result,
    messageId: result.messageId,
  };
};

// 1. OTP EMAIL

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

// 2. MAINTENANCE NOTIFICATION EMAIL

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

// 3. TENANCY AND MOVE-OUT NOTIFICATIONS

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
  reason,
  requestedMoveOutDate,
}) => {
  try {
    const formatDateOnly = (value) => {
      if (!value) return "";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return escapeHtml(String(value));
      return escapeHtml(
        d.toLocaleDateString("en-IN", {
          dateStyle: "medium",
        }),
      );
    };

    const date = (value) =>
      value
        ? new Date(value).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "N/A";

    const amount = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

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
          reason !== undefined && reason !== null
            ? typeof reason === "string" && reason.trim()
              ? `Your move-out request was rejected by the owner. Reason: ${escapeHtml(reason.trim())}`
              : "Your move-out request was rejected by the owner."
            : "Your move-out request was rejected because some bills are unpaid or pending. Please clear your outstanding bills before submitting another request. You may submit a new request immediately.",
        ownerMessage:
          reason !== undefined && reason !== null
            ? typeof reason === "string" && reason.trim()
              ? `You rejected the move-out request for ${escapeHtml(tenantName)}. Reason: ${escapeHtml(reason.trim())}`
              : `You rejected the move-out request for ${escapeHtml(tenantName)}.`
            : `The move-out request for ${escapeHtml(tenantName)} was rejected because unpaid or pending bills were found.`,
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
              `,
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
        ${requestedMoveOutDate ? `<p><strong>Requested Move-Out Date:</strong> ${formatDateOnly(requestedMoveOutDate)}</p>` : ""}
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
        }),
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
        }),
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

// 4. PAYMENT CONFIRMATION EMAILS

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
  method = "online",
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
        `,
      )
      .join("");

    const details = `
      <div style="background:#f8fafc;padding:18px;border-radius:8px;margin:20px 0;">
        <p><strong>Property:</strong> ${escapeHtml(propertyName)}</p>
        <p><strong>Address:</strong> ${escapeHtml(propertyAddress)}</p>
        <p><strong>Unit:</strong> ${escapeHtml(unitName)}</p>
        <p><strong>Payment date:</strong> ${escapeHtml(formattedDate)}</p>
        ${
          method === "cash"
            ? `<p><strong>Payment method:</strong> Cash (recorded by owner)</p>`
            : `<p><strong>Payment ID:</strong> ${escapeHtml(paymentId || "N/A")}</p>`
        }
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
        }),
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
        }),
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

// RENTAL APPLICATION NOTIFICATIONS

export const sendRentalApplicationNotification = async ({
  event,
  tenantEmail,
  tenantName,
  ownerEmail,
  ownerName,
  propertyName,
  propertyAddress,
  unitName,
  rent,
  moveInDate,
  message,
  rejectionReason,
}) => {
  const templates = {
    submitted: {
      subject: "RentGuard - New Rental Application",
      tenantText: "Your rental application has been submitted successfully.",
      ownerText: `A new rental application has been submitted by ${escapeHtml(tenantName)}.`,
    },
    approved: {
      subject: "RentGuard - Your Rental Application Was Approved",
      tenantText:
        "Good news! The property owner approved your application. Please log in to RentGuard to confirm or decline the lease offer.",
      ownerText: `You approved the rental application from ${escapeHtml(tenantName)}.`,
    },
    rejected: {
      subject: "RentGuard - Rental Application Update",
      tenantText: "The property owner has declined your rental application.",
      ownerText: `You declined the rental application from ${escapeHtml(tenantName)}.`,
    },
    accepted: {
      subject: "RentGuard - Lease Confirmed",
      tenantText:
        "You have accepted the rental offer. Your tenancy is now active.",
      ownerText: `${escapeHtml(tenantName)} accepted your rental offer. The unit is now occupied.`,
    },
    declined: {
      subject: "RentGuard - Rental Offer Declined",
      tenantText: "You declined the rental offer.",
      ownerText: `${escapeHtml(tenantName)} declined the rental offer.`,
    },
    cancelled: {
      subject: "RentGuard - Rental Application Cancelled",
      tenantText: "Your rental application was cancelled.",
      ownerText: `${escapeHtml(tenantName)} cancelled their rental application.`,
    },
  };

  const template = templates[event];
  if (!template) {
    console.error("Unsupported rental application email event:", event);
    return null;
  }

  const safeDate = moveInDate
    ? new Date(moveInDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Not specified";
  const safeAmount =
    rent === undefined || rent === null
      ? "Not specified"
      : `₹${Number(rent).toLocaleString("en-IN")}`;

  const details = `
    <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:20px 0;">
      <p><strong>Tenant:</strong> ${escapeHtml(tenantName || "Tenant")}</p>
      <p><strong>Property:</strong> ${escapeHtml(propertyName || "N/A")}</p>
      <p><strong>Address:</strong> ${escapeHtml(propertyAddress || "N/A")}</p>
      <p><strong>Unit:</strong> ${escapeHtml(unitName || "N/A")}</p>
      <p><strong>Monthly rent:</strong> ${escapeHtml(safeAmount)}</p>
      <p><strong>Proposed move-in:</strong> ${escapeHtml(safeDate)}</p>
      ${message ? `<p><strong>Applicant message:</strong><br>${escapeHtml(message).replace(/\\n/g, "<br>")}</p>` : ""}
      ${rejectionReason ? `<p><strong>Reason:</strong> ${escapeHtml(rejectionReason)}</p>` : ""}
    </div>
  `;

  const baseStyle =
    "font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;color:#333;line-height:1.6;";
  const emails = [];

  const loginButton = event === "approved" ? loginButtonHtml() : "";

  if (tenantEmail) {
    emails.push(
      sendEmail({
        to: tenantEmail,
        subject: template.subject,
        html: `<div style="${baseStyle}"><h2 style="color:#d4a017;">RentGuard</h2><p>Hello ${escapeHtml(tenantName || "Tenant")},</p><p>${template.tenantText}</p>${details}${loginButton}<p>Thank you for using RentGuard.</p></div>`,
      }),
    );
  }

  if (ownerEmail) {
    emails.push(
      sendEmail({
        to: ownerEmail,
        subject: template.subject,
        html: `<div style="${baseStyle}"><h2 style="color:#d4a017;">RentGuard</h2><p>Hello ${escapeHtml(ownerName || "Property Owner")},</p><p>${template.ownerText}</p>${details}${loginButton}<p>Please log in to your RentGuard dashboard to manage this application.</p></div>`,
      }),
    );
  }

  const results = await Promise.allSettled(emails);
  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error(
        "Rental application notification email failed:",
        result.reason,
      );
    }
  });
  return results;
};

// 6. CONTACT FORM EMAIL

export const sendContactEmail = async ({ name, email, topic, message }) => {
  try {
    const { fromEmail } = getBrevoConfig();

    await sendEmail({
      to: email,
      subject: `We received your enquiry: ${topic}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Thank you for contacting RentGuard!</h2>
          <p>Hello ${escapeHtml(name)},</p>
          <p>We have received your enquiry successfully.</p>
          <h3>Your enquiry details:</h3>
          <p><strong>Topic:</strong> ${escapeHtml(topic)}</p>
          <p><strong>Message:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
          <p>Thank you for reaching out to us.</p>
          <p>Regards,<br><strong>RentGuard Support Team</strong></p>
        </div>
      `,
      replyTo: fromEmail,
    });

    return true;
  } catch (error) {
    console.error("Contact email error:", error);
    throw error;
  }
};

// OWNER AND TENANT SIGNUP EMAILS

export const sendSignupEmails = async ({
  role,
  name,
  email,
  phone,
  registeredAt,
}) => {
  if (!["owner", "tenant"].includes(role)) {
    throw new Error("Invalid signup email role.");
  }

  const isOwner = role === "owner";

  const formattedDate = new Date(registeredAt || Date.now()).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

  const baseStyle = `
    font-family:Arial,sans-serif;
    max-width:600px;
    margin:auto;
    padding:25px;
    color:#333;
    line-height:1.6;
  `;

  const emails = [];

  // EMAIL 1: OWNER OR TENANT CONFIRMATION
  emails.push({
    recipient: role,
    to: email,
    subject: isOwner
      ? "Your RentGuard Account Has Been Created Successfully"
      : "Welcome to RentGuard - Signup Successful",
    html: `
      <div style="${baseStyle}">
        <h2 style="color:#d4a017;">RentGuard</h2>

        <h3 style="color:#15803d;">
          ${isOwner ? "Account Created Successfully!" : "Welcome to RentGuard!"}
        </h3>

        <p>Hello ${escapeHtml(name)},</p>

        ${
          isOwner
            ? `
              <p>
                Congratulations! Your RentGuard property owner
                account has been created successfully.
              </p>

              <div style="background:#fffbeb;padding:18px;border-radius:8px;">
                <p><strong>Account Name:</strong> ${escapeHtml(name)}</p>
                <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                <p><strong>Registration Date:</strong> ${escapeHtml(formattedDate)}</p>
                <p>
                  <strong>Verification Status:</strong>
                  <span style="color:#d97706;font-weight:bold;">
                    Pending
                  </span>
                </p>
              </div>

              <p>
                Our RentGuard team will review your details and
                contact you after completing the verification process.
              </p>

              <p>
                You can manage properties after your owner account
                has been approved.
              </p>
            `
            : `
              <p>
                Your tenant account has been created successfully
                on RentGuard.
              </p>

              <p>
                You can now log in using the OTP sent to your
                registered email address.
              </p>

              <div style="background:#f8fafc;padding:18px;border-radius:8px;">
                <p><strong>Account Name:</strong> ${escapeHtml(name)}</p>
                <p><strong>Email:</strong> ${escapeHtml(email)}</p>
                <p><strong>Registration Date:</strong> ${escapeHtml(formattedDate)}</p>
              </div>

              <p>
                Thank you for choosing RentGuard. We are happy
                to have you with us!
              </p>
            `
        }

        <p>Regards,<br /><strong>RentGuard Team</strong></p>
      </div>
    `,
  });

  // EMAIL 2: ADMIN NOTIFICATION - OWNER ONLY
  if (isOwner) {
    emails.push({
      recipient: "admin",
      to: "rentguard26@gmail.com",
      subject: "New Property Owner Registered - RentGuard",
      html: `
        <div style="${baseStyle}">
          <h2 style="color:#d4a017;">RentGuard</h2>

          <h3>New Property Owner Registration</h3>

          <p>
            A new property owner has successfully registered on RentGuard.
          </p>

          <div style="background:#f8fafc;padding:18px;border-radius:8px;">
            <p><strong>Owner Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(phone || "N/A")}</p>
            <p><strong>Registration Date:</strong> ${escapeHtml(formattedDate)}</p>
            <p><strong>Verification Status:</strong> Pending</p>
          </div>

          <p>
            Please log in to the RentGuard Admin Panel
            to review this owner's registration.
          </p>

          <p>Regards,<br /><strong>RentGuard Notifications</strong></p>
        </div>
      `,
    });
  }

  // SEND EMAILS INDEPENDENTLY
  const results = await Promise.all(
    emails.map(async ({ recipient, ...emailData }) => {
      try {
        const response = await sendEmail({
          ...emailData,
          senderName: "RentGuard",
        });

        console.log(
          `Signup email accepted for ${recipient}:`,
          response.messageId,
        );

        return {
          recipient,
          status: "sent",
          messageId: response.messageId,
        };
      } catch (error) {
        console.error(`Signup email failed for ${recipient}:`, error.message);

        return {
          recipient,
          status: "failed",
          error: error.message,
        };
      }
    }),
  );

  return results;
};


// OWNER APPROVAL CONFIRMATION EMAIL

export const sendOwnerApprovalEmail = async ({
  ownerName,
  ownerEmail,
  approvedAt,
}) => {
  try {
    if (!ownerEmail) {
      throw new Error("Owner email is required.");
    }

    const formattedDate = new Date(approvedAt || Date.now()).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
    );

    return await sendEmail({
      to: ownerEmail,
      senderName: "RentGuard",
      subject: "Congratulations! Your RentGuard Owner Account Is Approved",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;color:#333;line-height:1.6;">
          <h2 style="color:#d4a017;">RentGuard</h2>

          <h3 style="color:#15803d;">Owner Account Approved!</h3>

          <p>Hello ${escapeHtml(ownerName || "Property Owner")},</p>

          <p>
            Good news! Our RentGuard team has successfully reviewed
            and approved your property owner account.
          </p>

          <div style="background:#f0fdf4;padding:18px;border-radius:8px;margin:20px 0;">
            <p>
              <strong>Account Name:</strong>
              ${escapeHtml(ownerName || "Property Owner")}
            </p>
            <p>
              <strong>Email:</strong>
              ${escapeHtml(ownerEmail)}
            </p>
            <p>
              <strong>Verification Status:</strong>
              <span style="color:#15803d;font-weight:bold;">Approved</span>
            </p>
            <p>
              <strong>Approval Date:</strong>
              ${escapeHtml(formattedDate)}
            </p>
          </div>

          <p>
            You can now access the owner features of RentGuard,
            including adding and managing your properties,
            units, tenants, and rental bills.
          </p>

          <p>
            Log in to your RentGuard account to get started.
          </p>
          ${loginButtonHtml()}

          <p>
            Congratulations, and thank you for choosing RentGuard!
          </p>

          <p>Regards,<br /><strong>RentGuard Team</strong></p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Owner approval email failed:", error.message);
    return null;
  }
};
