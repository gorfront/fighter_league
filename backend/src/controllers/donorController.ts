// import { Request, Response } from "express";
// import { Transaction } from "sequelize";
// import User from "../models/User";
// import Donor from "../models/Donor";
// import sequelize from "../config/sequelize";
// interface DonorRegistrationPayload {
//   email: string;
//   walletAddress?: string;
//   logo_url?: string;
// }

// export const registerDonor = async (
//   req: Request<{}, {}, DonorRegistrationPayload>,
//   res: Response
// ) => {
//   const { email, walletAddress, logo_url } = req.body;

//   if (!email) {
//     return res.status(400).json({
//       message: "Missing required field: user email.",
//     });
//   }

//   let transaction: Transaction | undefined;

//   try {
//     transaction = await sequelize.transaction();

//     const user = await User.findOne({ where: { email }, transaction });
//     if (!user) {
//       await transaction.rollback();
//       return res.status(404).json({ message: "User not found." });
//     }
//     const existingDonor = await Donor.findOne({
//       where: { user_id: user.id },
//       transaction,
//     });
//     if (existingDonor) {
//       await transaction.rollback();
//       return res
//         .status(409)
//         .json({ message: "This user is already registered as a donor." });
//     }

//     await user.update(
//       { user_type: "DONOR", wallet_address: walletAddress },
//       { transaction }
//     );

//     const donor = await Donor.create(
//       {
//         email: user.email,
//         password: user.password,
//         user_id: user.id,
//         logo_url,
//         wallet_address: walletAddress,
//       },
//       { transaction }
//     );

//     await transaction.commit();

//     res.status(201).json({
//       message: "Donor profile created successfully and user profile updated.",
//       donorId: donor.id,
//     });
//   } catch (error: any) {
//     if (transaction) await transaction.rollback();
//     console.error("Donor registration failed:", error);

//     if (error.name === "SequelizeUniqueConstraintError") {
//       return res
//         .status(409)
//         .json({ message: "This user is already registered as a donor." });
//     }

//     res.status(500).json({
//       message: "An internal server error occurred during registration.",
//     });
//   }
// };

// export const getDonorProfile = async (req: Request, res: Response) => {
//   const userId = req.user?.id;

//   if (!userId) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   try {
//     const donor = await Donor.findOne({ where: { user_id: userId } });

//     if (!donor) {
//       return res.status(404).json({ message: "Donor profile not found" });
//     }

//     res.json(donor);
//   } catch (error) {
//     console.error("Error fetching donor profile:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

// export const updateDonorProfile = async (req: Request, res: Response) => {
//   const userId = req.user?.id;

//   if (!userId) {
//     return res.status(401).json({ message: "Unauthorized" });
//   }

//   try {
//     const donor = await Donor.findOne({ where: { user_id: userId } });

//     if (!donor) {
//       return res.status(404).json({ message: "Donor profile not found" });
//     }

//     await donor.update({
//       email: req.body.email || donor.email,
//       wallet_address: req.body.wallet_address || donor.wallet_address,
//       logo_url: req.body.logo_url || donor.logo_url,
//     });

//     res.json({ message: "Profile updated successfully", donor });
//   } catch (error) {
//     console.error("Error updating donor profile:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// };

import { Request, Response } from "express";
import { Transaction } from "sequelize";
import jwt from "jsonwebtoken"; // Import JWT
import User from "../models/User";
import Donor from "../models/Donor";
import sequelize from "../config/sequelize";

interface DonorRegistrationPayload {
  email: string;
  walletAddress?: string;
  logo_url?: string;
}

export const registerDonor = async (
  req: Request<{}, {}, DonorRegistrationPayload>,
  res: Response
) => {
  const { email, walletAddress, logo_url } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Missing required field: user email.",
    });
  }

  let transaction: Transaction | undefined;

  try {
    transaction = await sequelize.transaction();

    const user = await User.findOne({ where: { email }, transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found." });
    }

    const existingDonor = await Donor.findOne({
      where: { user_id: user.id },
      transaction,
    });
    if (existingDonor) {
      await transaction.rollback();
      return res
        .status(409)
        .json({ message: "This user is already registered as a donor." });
    }

    // 1. Update User Role
    await user.update(
      { user_type: "DONOR", wallet_address: walletAddress },
      { transaction }
    );

    // 2. Create Donor Profile
    const donor = await Donor.create(
      {
        email: user.email,
        password: user.password,
        user_id: user.id,
        logo_url,
        wallet_address: walletAddress,
      },
      { transaction }
    );

    await transaction.commit();

    // 3. 🛠️ FIX: Generate NEW Token with "DONOR" role
    const newToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        user_type: "DONOR", // Role updated
        name: user.name,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "30d" }
    );

    // 4. 🛠️ FIX: Send Token & User back
    res.status(201).json({
      message: "Donor profile created successfully.",
      donorId: donor.id,
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: "DONOR",
        wallet_address: user.wallet_address,
      },
    });
  } catch (error: any) {
    if (transaction) await transaction.rollback();
    console.error("Donor registration failed:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(409)
        .json({ message: "This user is already registered as a donor." });
    }

    res.status(500).json({
      message: "An internal server error occurred during registration.",
    });
  }
};

// ... keep getDonorProfile and updateDonorProfile
export const getDonorProfile = async (req: Request, res: Response) => {
  // ... existing code
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  try {
    const donor = await Donor.findOne({ where: { user_id: userId } });
    if (!donor)
      return res.status(404).json({ message: "Donor profile not found" });
    res.json(donor);
  } catch (error) {
    console.error("Error fetching donor profile:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateDonorProfile = async (req: Request, res: Response) => {
  // ... existing code
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Unauthorized" });
  try {
    const donor = await Donor.findOne({ where: { user_id: userId } });
    if (!donor)
      return res.status(404).json({ message: "Donor profile not found" });
    await donor.update({
      email: req.body.email || donor.email,
      wallet_address: req.body.wallet_address || donor.wallet_address,
      logo_url: req.body.logo_url || donor.logo_url,
    });
    res.json({ message: "Profile updated successfully", donor });
  } catch (error) {
    console.error("Error updating donor profile:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
