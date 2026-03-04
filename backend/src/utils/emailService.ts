import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { emailQueue } from "../services/emailQueue";
import { logger } from "./logger";

dotenv.config();

if (!process.env.SENDGRID_API_KEY) {
  logger.warn("❌ SENDGRID_API_KEY is missing from environment variables.");
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export const sendWelcomeEmail = async (
  toEmail: string,
  nextEvent: any,
  liveEvents: any[] = []
) => {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";

  const nextEventName = nextEvent?.title || "Upcoming Championship";
  const nextRawDate = nextEvent?.event_date || nextEvent?.date;
  const nextEventDate = nextRawDate ? new Date(nextRawDate).toDateString() : "Date TBD";
  const nextEventLocation = nextEvent?.location || "TBD";

  let html = `<div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">`;

  if (liveEvents && liveEvents.length > 0) {
    const liveListHtml = liveEvents
      .map(
        (event) => `
      <div style="margin-top: 15px; padding: 15px; background-color: rgba(255,255,255,0.1); border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
        <h3 style="margin: 0 0 10px 0; font-size: 20px;">${event.title}</h3>
        <a href="${frontendUrl}/events/${event.id}" style="display: inline-block; background-color: white; color: #dc2626; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 14px;">
          ▶ WATCH LIVE
        </a>
      </div>
    `
      )
      .join("");

    html += `
      <div style="background-color: #dc2626; padding: 30px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; animation: blink 1s infinite;">🚨 LIVE NOW 🚨</h1>
        <p style="font-size: 16px; margin-top: 10px;">Don't miss the action! We have ${liveEvents.length} events happening right now:</p>
        ${liveListHtml}
      </div>
      <div style="padding: 20px; background-color: #f9fafb;">
        <h3 style="color: #d97706; margin-top: 0; font-size: 22px;">Welcome to the Fight Club! 🥊</h3>
        <p>Thanks for subscribing. You'll be the first to know about all future fight announcements.</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-weight: bold; color: #6b7280; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">📅 Also Upcoming</p>
        <h4 style="margin: 5px 0 10px 0; font-size: 18px;">${nextEventName}</h4>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${nextEventDate}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${nextEventLocation}</p>
      </div>
    `;
  } else {
    html += `
      <div style="padding: 30px 20px; text-align: center; background-color: #f9fafb;">
        <h1 style="color: #d97706; font-size: 28px; margin-top: 0;">You're in! 🥊</h1>
        <p style="font-size: 16px;">Thanks for subscribing. You'll be the first to know about fight announcements.</p>
      </div>
      <div style="padding: 20px;">
        <p style="font-weight: bold; color: #6b7280; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">📅 Next Event</p>
        <h2 style="margin: 5px 0 10px 0; font-size: 22px;">${nextEventName}</h2>
        <p style="margin: 5px 0;"><strong>Date:</strong> ${nextEventDate}</p>
        <p style="margin: 5px 0;"><strong>Location:</strong> ${nextEventLocation}</p>
      </div>
    `;
  }

  html += `</div>`;

  try {
    const subject =
      liveEvents && liveEvents.length > 0
        ? `🚨 LIVE NOW: ${liveEvents.length} Events + Welcome!`
        : "Welcome to the Fight Club! 🥊";

    await emailQueue.add("send-welcome-email", {
      to: toEmail,
      subject,
      html,
    });
    logger.info(`✅ Welcome email enqueued for ${toEmail}`);
  } catch (error: any) {
    logger.error(`❌ Queue Error (Welcome): ${error.message}`);
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

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #d97706;">${heading}</h1>
      <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin-top: 0;">${eventName}</h2>
        <p><strong>📅 Date:</strong> ${eventDate}</p>
        <p><strong>📍 Location:</strong> ${eventLocation}</p>
      </div>
       <a href="${process.env.FRONTEND_URL || "http://localhost:8080"
    }/events/${eventDetails.id}" 
         style="background-color: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
         View Full Event
      </a>
    </div>
  `;

  try {
    await Promise.all(
      subscribers.map((subscriber) =>
        emailQueue.add("send-event-notification", {
          to: subscriber,
          subject,
          html,
        })
      )
    );
    logger.info(
      `✅ Event notification enqueued for ${subscribers.length} subscribers.`
    );
  } catch (error: any) {
    logger.error(`❌ Queue Error (Notification): ${error.message}`);
  }
};

export const sendApplicationStatusEmail = async (
  toEmail: string,
  fighterName: string,
  eventName: string,
  status: "approved" | "rejected"
) => {
  const color = status === "approved" ? "#16a34a" : "#dc2626";
  const title =
    status === "approved" ? "Application Approved!" : "Application Status";

  const subject =
    status === "approved"
      ? `🎉 Action Required: You are approved for ${eventName}!`
      : `Update regarding your application for ${eventName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background-color: ${color}; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">${title}</h1>
      </div>
      <div style="padding: 20px; color: #333;">
        <p>Hello <strong>${fighterName}</strong>,</p>
        ${status === "approved"
      ? `<p>Your application for <strong>${eventName}</strong> is <b>APPROVED</b>. Matchmakers will contact you soon.</p>`
      : `<p>We regret to inform you that we cannot offer you a spot on this specific event card.</p>`
    }
      </div>
    </div>
  `;

  try {
    await emailQueue.add("send-application-status", {
      to: toEmail,
      subject,
      html,
    });
    logger.info(`✅ Status email enqueued for ${toEmail}`);
  } catch (error: any) {
    logger.error(`❌ Queue Error (Status): ${error.message}`);
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
      © ${new Date().getFullYear()} Global League. All rights reserved.
    </div>
  </div>
`;

  try {
    await emailQueue.add("send-fight-match-email", {
      to: toEmail,
      subject,
      html,
    });
    logger.info(`✅ Fight match email enqueued for ${toEmail}`);
  } catch (error: any) {
    logger.error(`❌ Queue Error (Fight Match): ${error.message}`);
  }
};

export const sendStatusChangeNotification = async (
  subscribers: string[],
  eventDetails: any
) => {
  if (subscribers.length === 0) return;

  const eventName = eventDetails.title;
  const status = eventDetails.status.toUpperCase();

  const statusColor = status === "LIVE" ? "#16a34a" : "#374151";
  const subject =
    status === "LIVE"
      ? `🚨 LIVE NOW: ${eventName} has started!`
      : `🏁 Event Completed: ${eventName} results are in!`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background-color: ${statusColor}; padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">EVENT IS ${status}</h1>
      </div>
      <div style="padding: 20px; text-align: center;">
        <h2>${eventName}</h2>
        <p>The status of this event has changed to <strong>${status}</strong>.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:8080"
    }/events/${eventDetails.id}" 
             style="background-color: #d97706; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
             ${status === "LIVE" ? "WATCH LIVE" : "VIEW RESULTS"}
          </a>
        </div>
      </div>
    </div>
  `;

  try {
    await Promise.all(
      subscribers.map((subscriber) =>
        emailQueue.add("send-status-change-notification", {
          to: subscriber,
          subject,
          html,
        })
      )
    );
    logger.info(
      `✅ Status notification enqueued for ${subscribers.length} subscribers.`
    );
  } catch (error: any) {
    logger.error(`❌ Queue Error (Status Change): ${error.message}`);
  }
};
