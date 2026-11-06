import { sendContactEmail } from "../utils/email.js";

const allowedTopics = [
  "General enquiry",
  "Property management",
  "Rent and payments",
  "Tenant documents",
  "Account or technical issue",
  "Feedback",
];

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, topic, message } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof topic !== "string" ||
      typeof message !== "string"
    ) {
      return res.status(400).json({
        message: "Please provide valid contact details.",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanMessage = message.trim();

    if (cleanName.length < 2 || cleanName.length > 100) {
      return res.status(400).json({
        message: "Name must be between 2 and 100 characters.",
      });
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (!allowedTopics.includes(topic)) {
      return res.status(400).json({
        message: "Please select a valid enquiry topic.",
      });
    }

    if (!cleanMessage || cleanMessage.length > 3000) {
      return res.status(400).json({
        message: "Message is required and must not exceed 3000 characters.",
      });
    }

    await sendContactEmail({
      name: cleanName,
      email: cleanEmail,
      topic,
      message: cleanMessage,
    });

    return res.status(200).json({
      message: "Your message has been sent successfully.",
    });
  } catch (error) {
    console.error("Contact form email error:", error);

    return res.status(500).json({
      message: "Unable to send your message right now. Please try again.",
    });
  }
};
