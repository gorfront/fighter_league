import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User";

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

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with this email already exists" });
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

    const token = generateToken(newUser.id, email, name);

    res.status(201).json({
      message: "User registered successfully",
      token,
    });
  } catch (error) {
    console.error("Registration failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Invalid credentials. No match users" });
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
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const connectWallet = async (req: Request, res: Response) => {
  res.status(501).json({ message: "Not implemented yet" });
};

export const verifySignature = async (req: Request, res: Response) => {
  res.status(501).json({ message: "Not implemented yet" });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authorized" });
  }
  res.status(200).json(req.user);
};

// import { Request, Response } from "express";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcryptjs";
// import User from "../models/User";

// const generateToken = (
//   id: number,
//   email: string,
//   user_type: string,
//   name?: string
// ): string => {
//   return jwt.sign(
//     { id, email, user_type, name },
//     process.env.JWT_SECRET as string,
//     { expiresIn: "30d" }
//   );
// };

// const validateEmail = (email: string) => {
//   const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return re.test(email);
// };

// const validatePassword = (password: string) => {
//   const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W_]{6,}$/;
//   return re.test(password);
// };

// export const registerUser = async (req: Request, res: Response) => {
//   const { name, email, password } = req.body;

//   if (!email || !password || !name) {
//     return res
//       .status(400)
//       .json({ message: "Please provide all required fields" });
//   }

//   if (!validateEmail(email)) {
//     return res.status(400).json({ message: "Invalid email format" });
//   }

//   if (!validatePassword(password)) {
//     return res.status(400).json({
//       message:
//         "Password must be at least 6 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
//     });
//   }

//   try {
//     const existingUser = await User.findOne({ where: { email } });

//     if (existingUser) {
//       return res
//         .status(409)
//         .json({ message: "User with this email already exists" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const newUser = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       wallet_address: null,
//       nonce: null,
//       country: null,
//       is_military: false,
//     });

//     const token = generateToken(newUser.id, email, name);

//     res.status(201).json({
//       message: "User registered successfully",
//       token,
//     });
//   } catch (error) {
//     console.error("Registration failed:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// export const loginUser = async (req: Request, res: Response) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res
//       .status(400)
//       .json({ message: "Please provide email and password" });
//   }

//   if (!validateEmail(email)) {
//     return res.status(400).json({ message: "Invalid email format" });
//   }

//   try {
//     const user = await User.findOne({ where: { email } });

//     if (!user) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const token = generateToken(user.id, user.email, user.user_type, user.name);

//     res.status(200).json({
//       message: "Authentication successful",
//       token,
//       user_type: user.user_type,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         wallet_address: user.wallet_address,
//         user_type: user.user_type,
//       },
//     });
//   } catch (error) {
//     console.error("Login failed:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// export const connectWallet = async (req: Request, res: Response) => {
//   res.status(501).json({ message: "Not implemented yet" });
// };

// export const verifySignature = async (req: Request, res: Response) => {
//   res.status(501).json({ message: "Not implemented yet" });
// };

// export const getCurrentUser = async (req: Request, res: Response) => {
//   if (!req.user) {
//     return res.status(401).json({ message: "Not authorized" });
//   }
//   res.status(200).json(req.user);
// };
