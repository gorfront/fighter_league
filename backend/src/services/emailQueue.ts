import { Queue, Worker } from "bullmq";
import Redis from "ioredis";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config();

const redisOptions: any = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL, maxRetriesPerRequest: null }
    : { host: "127.0.0.1", port: 6379, maxRetriesPerRequest: null };

let hasLoggedRedisError = false;

redisOptions.retryStrategy = (times: number) => {
    if (times === 1 || times % 20 === 0) {
        logger.warn(`Redis connection retry attempt ${times}...`);
    }
    return Math.min(times * 50, 2000);
};

const connection = new Redis(
    redisOptions.url || redisOptions
);

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

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export const emailWorker = new Worker(
    "email-queue",
    async (job) => {
        const { to, subject, html } = job.data;
        try {
            await transporter.sendMail({
                from: `"Fighter League" <${process.env.SMTP_USER}>`,
                to,
                subject,
                html,
            });
            logger.info(`Email sent to: ${to}`);
        } catch (error: any) {
            logger.error(`Failed to send email to ${to}: ${error.message}`);
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
