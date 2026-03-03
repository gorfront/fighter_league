import { Request, Response } from "express";
import Comment from "../models/Comment";
import User from "../models/User";
import { asyncHandler, AppError } from "../utils/errorHandling";

export const createComment = asyncHandler(async (req: Request, res: Response) => {
    const { fight_id, content } = req.body;
    const user = req.user;

    if (!user) {
        throw new AppError("Not authorized", 401);
    }

    if (user.user_type === "GUEST") {
        throw new AppError("Guest users cannot comment", 403);
    }

    if (!content || !content.trim()) {
        throw new AppError("Content cannot be empty", 400);
    }

    const newComment = await Comment.create({
        fight_id,
        user_id: user.id,
        content,
    });

    const commentWithAuthor = await Comment.findByPk(newComment.id, {
        include: [
            {
                model: User,
                as: "author",
                attributes: ["id", "name", "avatar", "country", "user_type"],
            }
        ]
    });

    res.status(201).json(commentWithAuthor);
});

export const getComments = asyncHandler(async (req: Request, res: Response) => {
    const { fightId } = req.params;

    const comments = await Comment.findAll({
        where: { fight_id: fightId },
        include: [
            {
                model: User,
                as: "author",
                attributes: ["id", "name", "avatar", "country", "user_type"],
            },
        ],
        order: [["created_at", "DESC"]], // Newest first
    });

    res.status(200).json(comments);
});
