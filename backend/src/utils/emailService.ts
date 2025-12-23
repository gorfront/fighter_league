import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendWelcomeEmail = async (toEmail: string, eventDetails: any) => {
  const eventName = eventDetails?.title || "Upcoming Championship";

  const rawDate = eventDetails?.event_date || eventDetails?.date;
  const eventDate = rawDate ? new Date(rawDate).toDateString() : "Date TBD";

  const eventLocation = eventDetails?.location || "TBD";

  const mailOptions = {
    from: `"Valor League" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Welcome to the Fight Club! 🥊",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #d97706;">You're in!</h1>
        <p>Thanks for subscribing. You'll be the first to know about fight announcements.</p>

        <hr style="border: 1px solid #eee; margin: 20px 0;" />

        <h2>📅 Next Event: ${eventName}</h2>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>

        <br />
        <p style="font-size: 12px; color: #888;">Valor League Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendEventNotification = async (
  subscribers: string[],
  eventDetails: any,
  type: "NEW" | "UPDATE"
) => {
  if (subscribers.length === 0) return;

  const eventName = eventDetails.title || "Championship Event";
  const eventDate = new Date(eventDetails.event_date).toDateString();
  const eventLocation = eventDetails.location || "TBD";

  const subject =
    type === "NEW"
      ? `🔥 NEW EVENT ANNOUNCED: ${eventName}`
      : `⚠️ UPDATE: Changes to ${eventName}`;

  const heading =
    type === "NEW" ? "New Fight Night Announced!" : "Event Details Updated";

  for (const email of subscribers) {
    const mailOptions = {
      from: `"Valor League" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #d97706;">${heading}</h1>
          <p>We have exciting news for you. Check out the details below!</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">${eventName}</h2>
            <p><strong>📅 Date:</strong> ${eventDate}</p>
            <p><strong>📍 Location:</strong> ${eventLocation}</p>
            <p><strong>🥊 Division:</strong> ${
              eventDetails.division || "Open Weight"
            }</p>
          </div>
          
          <a href="${
            process.env.CLIENT_URL || "http://localhost:5173"
          }/events/${eventDetails.id}" 
             style="background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
             View Full Event
          </a>
          
          <br /><br />
          <p style="font-size: 12px; color: #888;">
            You received this because you are subscribed to Valor League updates.
          </p>
        </div>
      `,
    };

    transporter
      .sendMail(mailOptions)
      .catch((err) => console.error(`Failed to send to ${email}`, err));
  }
};
