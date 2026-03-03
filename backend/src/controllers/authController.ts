import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";
import TokenBlacklist from "../models/TokenBlacklist";
import { asyncHandler, AppError } from "../utils/errorHandling";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const generateToken = (
  id: number,
  email: string,
  user_type: string,
  name?: string
): string => {
  return jwt.sign(
    { id, email, user_type, name },
    process.env.JWT_SECRET as string,
    { expiresIn: "30d" }
  );
};

export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    wallet_address: null,
    nonce: null,
    country: null,
    is_military: false,
  });

  const token = generateToken(newUser.id, email, newUser.user_type, name);

  res.status(201).json({
    message: "User registered successfully",
    token,
  });
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new AppError("Invalid credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new AppError("Invalid credentials. No match users", 401);
  }

  const token = generateToken(user.id, user.email, user.user_type, user.name);

  res.status(200).json({
    message: "Authentication successful",
    token,
    user_type: user.user_type,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      wallet_address: user.wallet_address,
      user_type: user.user_type,
    },
  });
});

export const connectWallet = async (req: Request, res: Response) => {
  res.status(501).json({ message: "Not implemented yet" });
};

export const verifySignature = async (req: Request, res: Response) => {
  res.status(501).json({ message: "Not implemented yet" });
};

export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError("Not authorized", 401);
  }
  res.status(200).json(req.user);
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("No token provided", 400);
  }

  const token = authHeader.split(" ")[1];

  const decoded = jwt.decode(token) as JwtPayload;
  if (!decoded || !decoded.exp) {
    throw new AppError("Invalid token structure", 400);
  }

  const expiresAt = new Date(decoded.exp * 1000);

  const isBlacklisted = await TokenBlacklist.findOne({ where: { token } });
  if (!isBlacklisted) {
    await TokenBlacklist.create({ token, expires_at: expiresAt });
  }

  res.status(200).json({ message: "Logged out successfully" });
});
