import { Request, Response } from "express";
import Comment from "../models/Comment";
import User from "../models/User";

export const createComment = async (req: Request, res: Response) => {
    try {
        const { fight_id, content } = req.body;
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: "Not authorized" });
        }

        if (user.user_type === "GUEST") {
            return res.status(403).json({ message: "Guest users cannot comment" });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ message: "Content cannot be empty" });
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

        return res.status(201).json(commentWithAuthor);
    } catch (error) {
        console.error("Error creating comment:", error);
        return res.status(500).json({ message: "Server error creating comment" });
    }
};

export const getComments = async (req: Request, res: Response) => {
    try {
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

        return res.status(200).json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return res.status(500).json({ message: "Server error fetching comments" });
    }
};
