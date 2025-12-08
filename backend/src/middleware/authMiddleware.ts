import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User from "../models/User";

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      id: number;
      name: string;
      email: string;
      user_type: string;
      wallet_address?: string;
      country?: string;
      is_military?: boolean;
    };
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    const user = await User.findByPk(decoded.id, {
      attributes: [
        "id",
        "name",
        "email",
        "user_type",
        "wallet_address",
        "country",
        "is_military",
      ],
    });

    if (!user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    if (!user.user_type) {
      return res.status(500).json({
        message:
          "Server configuration error: User type is missing from database.",
      });
    }

    req.user = user.get({ plain: true });
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};
