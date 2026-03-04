import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config();

let hasLoggedRedisError = false;

const connectionOptions = {
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => {
        if (times === 1 || times % 20 === 0) {
            logger.warn(`Redis connection retry attempt ${times}...`);
        }
        return Math.min(times * 50, 2000);
    }
};

const connection = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, connectionOptions)
    : new Redis({ host: "127.0.0.1", port: 6379, ...connectionOptions });

connection.on("error", (error) => {
    if (!hasLoggedRedisError) {
        logger.error(`Redis connection error: ${error.message} (further connection errors will be suppressed)`);
        hasLoggedRedisError = true;
    }
});

export const emailQueue = new Queue("email-queue", { connection: connection as any });

emailQueue.on("error", (error) => {
    if (!hasLoggedRedisError) {
        logger.error(`BullMQ queue error: ${error.message}`);
    }
});

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

const FROM_EMAIL = process.env.EMAIL_USER;

export const emailWorker = new Worker(
    "email-queue",
    async (job) => {
        const { to, subject, html } = job.data;

        try {
            if (!FROM_EMAIL) throw new Error("EMAIL_USER is missing in .env");

            const msg = {
                to,
                from: FROM_EMAIL,
                subject,
                html,
            };

            await sgMail.send(msg);
            logger.info(`✅ Email successfully processed by worker and sent to: ${to}`);
        } catch (error: any) {
            logger.error(`❌ Worker failed to send email to ${to}: ${error.response?.body || error.message}`);
            throw error;
        }
    },
    { connection: connection as any }
);

emailWorker.on("error", (error) => {
    if (!hasLoggedRedisError) {
        logger.error(`BullMQ worker error: ${error.message}`);
    }
});
