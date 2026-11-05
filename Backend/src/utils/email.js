import nodemailer from "nodemailer";

export const sendOtpEmail = async (email, otp) => {
  try {
    const emailUser = process.env.EMAIL_USER?.trim();
    const emailPass = process.env.EMAIL_PASS?.replace(/\s/g, "");

    // Check credentials
    console.log("Email configured:", Boolean(emailUser));
    console.log("Password configured:", Boolean(emailPass));

    if (!emailUser || !emailPass) {
      throw new Error("EMAIL_USER or EMAIL_PASS is missing in .env");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const mailOptions = {
      from: `"RentGuard" <${emailUser}>`,
      to: email,
      subject: "Your RentGuard Login OTP",
      html: `
        <div style="font-family: Arial; max-width: 500px; margin: auto; padding: 25px;">
          <h2 style="color: #d4a017;">RentGuard</h2>
          <h3>Your Login OTP</h3>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 8px;">${otp}</h1>
          <p>This OTP expires in 5 minutes.</p>
          <p>Do not share this code with anyone.</p>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);

    console.log("OTP email sent:", result.messageId);

    return result;
  } catch (error) {
    console.error("OTP email sending failed:", error.message);
    throw new Error("Unable to send OTP email.");
  }
};