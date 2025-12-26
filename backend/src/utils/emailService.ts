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

import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Helps if Render's IP is being flagged
  },
  // ⬇️ CRITICAL FIXES ⬇️
  logger: true,
  debug: true,
  connectionTimeout: 60000, // Increase to 60 seconds (was 10s)
  greetingTimeout: 30000, // Wait 30s for the server to say "Hello"
  socketTimeout: 60000, // Wait 60s for data to flow
  dns: {
    useIPv4: true, // Force IPv4 to prevent IPv6 hanging issues
  },
} as nodemailer.TransportOptions);

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
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${toEmail}`);
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
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
  const heading =
    type === "NEW" ? "New Fight Night Announced!" : "Event Details Updated";
  const subject =
    type === "NEW"
      ? `🔥 NEW EVENT ANNOUNCED: ${eventName}`
      : `⚠️ UPDATE: Changes to ${eventName}`;

  // FIX 2: Removed the duplicate 'for' loop. Using ONLY Promise.allSettled
  console.log(
    `📧 Sending ${type} notification to ${subscribers.length} subscribers...`
  );

  const emailPromises = subscribers.map((email) => {
    const mailOptions = {
      from: `"Valor League" <${process.env.EMAIL_USER}>`,
      to: email,
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
    return transporter.sendMail(mailOptions);
  });

  const results = await Promise.allSettled(emailPromises);

  // Log results
  const successful = results.filter((r) => r.status === "fulfilled").length;
  console.log(
    `✅ Sent ${successful} emails. ❌ Failed ${results.length - successful}.`
  );
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
         <p>The matchmakers will be in touch shortly to confirm your opponent and bout details.</p>
         <p>Get ready!</p>`
      : `<p>Dear <strong>${fighterName}</strong>,</p>
         <p>Thank you for your interest in <strong>${eventName}</strong>.</p>
         <p>After reviewing the fight card, we regret to inform you that we cannot offer you a spot on this specific event.</p>
         <p>Please keep training and apply for future events!</p>`;

  const mailOptions = {
    from: `"Valor League Matchmaker" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: ${color}; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">${title}</h1>
        </div>
        <div style="padding: 20px; color: #333; line-height: 1.6;">
          ${messageBody}
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          © ${new Date().getFullYear()} Valor League. All rights reserved.
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Application email sent to ${toEmail} for status: ${status}`);
  } catch (error) {
    console.error("Error sending application status email:", error);
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

  const html = `
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
          <p style="color: #6b7280; margin-top: 5px;">(Opponent)</p>
        </div>

        <div style="text-align: left; background: #fff7ed; padding: 15px; border-radius: 5px; border: 1px solid #ffedd5;">
          <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
          <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${location}</p>
        </div>

        <p>Please contact the matchmaker if you have any questions.</p>
        <p style="font-weight: bold;">Good luck!</p>
      </div>

      <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        © ${new Date().getFullYear()} Valor League. All rights reserved.
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Valor League Matchmaker" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html,
    });
    console.log(`Fight match email sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending fight match email:", error);
  }
};
