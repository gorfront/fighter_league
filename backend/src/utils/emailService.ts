import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.SENDGRID_API_KEY) {
  console.warn("❌ SENDGRID_API_KEY is missing from environment variables.");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.EMAIL_USER || "noreply@valorleague.com";

/**
 * Sends a Welcome Email to new subscribers
 */
export const sendWelcomeEmail = async (toEmail: string, eventDetails: any) => {
  const eventName = eventDetails?.title || "Upcoming Championship";
  const rawDate = eventDetails?.event_date || eventDetails?.date;
  const eventDate = rawDate ? new Date(rawDate).toDateString() : "Date TBD";
  const eventLocation = eventDetails?.location || "TBD";

  const msg = {
    to: toEmail,
    from: `"Valor League" <${FROM_EMAIL}>`,
    subject: "Welcome to the Fight Club! 🥊",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #d97706;">You're in!</h1>
        <p>Thanks for subscribing. You'll be the first to know about fight announcements.</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <h2>📅 Next Event: ${eventName}</h2>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Welcome email sent to ${toEmail}`);
  } catch (error) {
    console.error("❌ SendGrid Error (Welcome):", error);
  }
};

/**
 * Sends notifications to a batch of subscribers
 */
export const sendEventNotification = async (
  subscribers: string[],
  eventDetails: any,
  type: "NEW" | "UPDATE"
) => {
  if (subscribers.length === 0) return;

  const eventName = eventDetails.title || "Championship Event";
  const eventDate = new Date(eventDetails.event_date).toDateString();
  const eventLocation = eventDetails.location || "TBD";
  const heading =
    type === "NEW" ? "New Fight Night Announced!" : "Event Details Updated";
  const subject =
    type === "NEW"
      ? `🔥 NEW EVENT ANNOUNCED: ${eventName}`
      : `⚠️ UPDATE: Changes to ${eventName}`;

  const msg = {
    to: subscribers,
    from: `"Valor League" <${FROM_EMAIL}>`,
    subject: subject,
    html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #d97706;">${heading}</h1>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">${eventName}</h2>
            <p><strong>📅 Date:</strong> ${eventDate}</p>
            <p><strong>📍 Location:</strong> ${eventLocation}</p>
          </div>
           <a href="${
             process.env.FRONTEND_URL || "http://localhost:8080"
           }/events/${eventDetails.id}" 
             style="background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
             View Full Event
          </a>
        </div>
      `,
  };

  try {
    // isMultiple: true ensures users don't see each other's email addresses
    await sgMail.sendMultiple(msg);
    console.log(
      `✅ Event notification sent to ${subscribers.length} subscribers.`
    );
  } catch (error) {
    console.error("❌ SendGrid Error (Notification):", error);
  }
};

/**
 * Sends status updates (Approved/Rejected)
 */
export const sendApplicationStatusEmail = async (
  toEmail: string,
  fighterName: string,
  eventName: string,
  status: "approved" | "rejected"
) => {
  const color = status === "approved" ? "#16a34a" : "#dc2626";
  const title =
    status === "approved" ? "Application Approved!" : "Application Status";

  const msg = {
    to: toEmail,
    from: `"Valor League Matchmaker" <${FROM_EMAIL}>`,
    subject:
      status === "approved"
        ? `🎉 Action Required: You are approved for ${eventName}!`
        : `Update regarding your application for ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background-color: ${color}; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">${title}</h1>
        </div>
        <div style="padding: 20px; color: #333;">
          <p>Hello <strong>${fighterName}</strong>,</p>
          ${
            status === "approved"
              ? `<p>Your application for <strong>${eventName}</strong> is <b>APPROVED</b>. Matchmakers will contact you soon.</p>`
              : `<p>We regret to inform you that we cannot offer you a spot on this specific event card.</p>`
          }
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`✅ Status email sent to ${toEmail}`);
  } catch (error) {
    console.error("❌ SendGrid Error (Status):", error);
  }
};
