// import nodemailer from "nodemailer";
// import dotenv from "dotenv";

// dotenv.config();

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// export const sendWelcomeEmail = async (toEmail: string, eventDetails: any) => {
//   const eventName = eventDetails?.title || "Upcoming Championship";

//   const rawDate = eventDetails?.event_date || eventDetails?.date;
//   const eventDate = rawDate ? new Date(rawDate).toDateString() : "Date TBD";

//   const eventLocation = eventDetails?.location || "TBD";

//   const mailOptions = {
//     from: `"Valor League" <${process.env.EMAIL_USER}>`,
//     to: toEmail,
//     subject: "Welcome to the Fight Club! 🥊",
//     html: `
//       <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
//         <h1 style="color: #d97706;">You're in!</h1>
//         <p>Thanks for subscribing. You'll be the first to know about fight announcements.</p>

//         <hr style="border: 1px solid #eee; margin: 20px 0;" />

//         <h2>📅 Next Event: ${eventName}</h2>
//         <p><strong>Date:</strong> ${eventDate}</p>
//         <p><strong>Location:</strong> ${eventLocation}</p>

//         <br />
//         <p style="font-size: 12px; color: #888;">Valor League Team</p>
//       </div>
//     `,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// };

// export const sendEventNotification = async (
//   subscribers: string[],
//   eventDetails: any,
//   type: "NEW" | "UPDATE"
// ) => {
//   if (subscribers.length === 0) return;

//   const eventName = eventDetails.title || "Championship Event";
//   const eventDate = new Date(eventDetails.event_date).toDateString();
//   const eventLocation = eventDetails.location || "TBD";

//   const subject =
//     type === "NEW"
//       ? `🔥 NEW EVENT ANNOUNCED: ${eventName}`
//       : `⚠️ UPDATE: Changes to ${eventName}`;

//   const heading =
//     type === "NEW" ? "New Fight Night Announced!" : "Event Details Updated";

//   for (const email of subscribers) {
//     const mailOptions = {
//       from: `"Valor League" <${process.env.EMAIL_USER}>`,
//       to: email,
//       subject: subject,
//       html: `
//         <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
//           <h1 style="color: #d97706;">${heading}</h1>
//           <p>We have exciting news for you. Check out the details below!</p>

//           <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
//             <h2 style="margin-top: 0;">${eventName}</h2>
//             <p><strong>📅 Date:</strong> ${eventDate}</p>
//             <p><strong>📍 Location:</strong> ${eventLocation}</p>
//             <p><strong>🥊 Division:</strong> ${
//               eventDetails.division || "Open Weight"
//             }</p>
//           </div>

//           <a href="${
//             process.env.CLIENT_URL || "http://localhost:5173"
//           }/events/${eventDetails.id}"
//              style="background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
//              View Full Event
//           </a>

//           <br /><br />
//           <p style="font-size: 12px; color: #888;">
//             You received this because you are subscribed to Valor League updates.
//           </p>
//         </div>
//       `,
//     };

//     transporter
//       .sendMail(mailOptions)
//       .catch((err) => console.error(`Failed to send to ${email}`, err));
//   }
// };

import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();

// FIX 1: Trim whitespace to prevent "Invalid API Key" errors
const rawKey = process.env.RESEND_API_KEY;
const resendApiKey = rawKey ? rawKey.trim() : "";

// FIX 2: Safe Debug Log (Shows length/start of key to verify it loaded)
if (!resendApiKey) {
  console.warn("⚠️ RESEND_API_KEY is missing. Email sending will fail.");
} else {
  console.log(
    `🔑 Resend Key Loaded: Length=${
      resendApiKey.length
    }, StartsWith=${resendApiKey.substring(0, 3)}...`
  );
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Define a consistent sender address.
// NOTE: Ensure 'valorleague.com' is verified in Resend, otherwise use 'onboarding@resend.dev'
const FROM_EMAIL = "Valor League <onboarding@resend.dev>";

export const sendWelcomeEmail = async (toEmail: string, eventDetails: any) => {
  if (!resend) {
    console.error("❌ Cannot send email: Resend is not initialized");
    return;
  }
  const eventName = eventDetails?.title || "Upcoming Championship";
  const rawDate = eventDetails?.event_date || eventDetails?.date;
  const eventDate = rawDate ? new Date(rawDate).toDateString() : "Date TBD";
  const eventLocation = eventDetails?.location || "TBD";

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
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
    });

    if (error) {
      console.error("❌ Resend API Error:", error);
      return;
    }
    console.log(`✅ Welcome email sent to ${toEmail}. ID: ${data?.id}`);
  } catch (err) {
    console.error("❌ Unexpected error sending welcome email:", err);
  }
};

export const sendEventNotification = async (
  subscribers: string[],
  eventDetails: any,
  type: "NEW" | "UPDATE"
) => {
  if (subscribers.length === 0) return;

  if (!resend) {
    console.error("❌ Cannot send email: Resend is not initialized");
    return;
  }

  const eventName = eventDetails.title || "Championship Event";
  const eventDate = new Date(eventDetails.event_date).toDateString();
  const eventLocation = eventDetails.location || "TBD";
  const heading =
    type === "NEW" ? "New Fight Night Announced!" : "Event Details Updated";
  const subject =
    type === "NEW"
      ? `🔥 NEW EVENT ANNOUNCED: ${eventName}`
      : `⚠️ UPDATE: Changes to ${eventName}`;

  console.log(
    `📧 Sending ${type} notification to ${subscribers.length} subscribers...`
  );

  // Map subscribers to Resend API calls
  const emailPromises = subscribers.map((email) => {
    return resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
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
    });
  });

  // Use Promise.allSettled to ensure one failure doesn't stop the rest
  const results = await Promise.allSettled(emailPromises);

  const successful = results.filter(
    (r) => r.status === "fulfilled" && !r.value.error
  ).length;
  const failed = results.length - successful;

  console.log(`✅ Sent ${successful} emails. ❌ Failed ${failed}.`);
};

export const sendApplicationStatusEmail = async (
  toEmail: string,
  fighterName: string,
  eventName: string,
  status: "approved" | "rejected"
) => {
  const subject =
    status === "approved"
      ? `🎉 Action Required: You are approved for ${eventName}!`
      : `Update regarding your application for ${eventName}`;

  const color = status === "approved" ? "#16a34a" : "#dc2626";
  const title =
    status === "approved" ? "Application Approved!" : "Application Status";

  const messageBody =
    status === "approved"
      ? `<p>Congratulations <strong>${fighterName}</strong>!</p>
         <p>Your application to fight in <strong>${eventName}</strong> has been <span style="color:${color}; font-weight:bold;">APPROVED</span>.</p>
         <p>The matchmakers will be in touch shortly to confirm your opponent and bout details.</p>`
      : `<p>Dear <strong>${fighterName}</strong>,</p>
         <p>Thank you for your interest in <strong>${eventName}</strong>.</p>
         <p>After reviewing the fight card, we regret to inform you that we cannot offer you a spot on this specific event.</p>`;

  if (!resend) {
    console.error("❌ Cannot send email: Resend is not initialized");
    return;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${color}; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">${title}</h1>
          </div>
          <div style="padding: 20px; color: #333; line-height: 1.6;">
            ${messageBody}
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend API Error:", error);
      return;
    }
    console.log(
      `✅ Application status email sent to ${toEmail}. ID: ${data?.id}`
    );
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
};

export const sendFightMatchEmail = async (
  toEmail: string,
  fighterName: string,
  opponentName: string,
  eventName: string,
  eventDate: string,
  location: string
) => {
  const subject = `🥊 Fight Confirmation: You vs ${opponentName}`;
  if (!resend) {
    console.error("❌ Cannot send email: Resend is not initialized");
    return;
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #d97706; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Fight Confirmed!</h1>
          </div>
          <div style="padding: 20px; color: #333; line-height: 1.6; text-align: center;">
            <p style="font-size: 18px;">Hello <strong>${fighterName}</strong>,</p>
            <p>Your bout for <strong>${eventName}</strong> has been officially set.</p>
            <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
              <h2 style="color: #dc2626; margin: 0 0 10px 0;">VS</h2>
              <p style="font-size: 20px; font-weight: bold; margin: 0;">${opponentName}</p>
            </div>
            <div style="text-align: left; background: #fff7ed; padding: 15px; border-radius: 5px;">
              <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
              <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${location}</p>
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("❌ Resend API Error:", error);
      return;
    }
    console.log(`✅ Fight match email sent to ${toEmail}. ID: ${data?.id}`);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
  }
};
