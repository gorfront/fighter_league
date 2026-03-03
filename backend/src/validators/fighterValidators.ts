import { z } from "zod";

export const createFighterSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email format"),
        country: z.string().min(1, "Country is required"),
        walletAddress: z.string().optional().nullable(),
        weight: z.number().min(0, "Weight must be positive"),
        gender: z.string().min(1, "Gender is required"),
        division: z.string().min(1, "Division is required"),
        wins: z.number().int().min(0).optional(),
        losses: z.number().int().min(0).optional(),
        draws: z.number().int().min(0).optional(),
        knockouts: z.number().int().min(0).optional(),
        image: z.string().min(1, "Image is required"),
        bio: z.string().optional().nullable(),
        achievements: z.array(z.string()).optional(),
        age: z.number().int().positive().optional().nullable(),
        height: z.string().optional().nullable(),
        reach: z.string().optional().nullable(),
    }),
});
