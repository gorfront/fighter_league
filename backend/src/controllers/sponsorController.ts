import { Request, Response } from "express";
import { Op, Transaction } from "sequelize";
import User from "../models/User";
import Sponsor from "../models/Sponsor";
import sequelize from "../config/sequelize";

interface SponsorRegistrationPayload {
  email: string;
  companyName: string;
  logoUrl: string;
  description: string;
  tier?: string;
  walletAddress?: string;
}

export const registerSponsor = async (
  req: Request<{}, {}, SponsorRegistrationPayload>,
  res: Response
) => {
  const { email, companyName, logoUrl, description, tier, walletAddress } =
    req.body;

  if (!email || !companyName || !logoUrl) {
    return res.status(400).json({
      message:
        "Missing required fields: user email, company name, and logo URL.",
    });
  }

  if (walletAddress && !/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).json({ message: "Invalid wallet address format." });
  }

  const sponsorTier = tier || "Partner";
  let transaction: Transaction | undefined;

  try {
    transaction = await sequelize.transaction();

    const user = await User.findOne({ where: { email }, transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found." });
    }

    if (walletAddress) {
      const existingWallet = await User.findOne({
        where: { wallet_address: walletAddress },
        transaction,
      });

      if (existingWallet && existingWallet.id !== user.id) {
        await transaction.rollback();
        return res.status(409).json({
          message: "Wallet address already in use by another user.",
        });
      }
    }

    const existingSponsor = await Sponsor.findOne({
      where: { user_id: user.id },
      transaction,
    });
    if (existingSponsor) {
      await transaction.rollback();
      return res.status(409).json({
        message:
          "This user is already registered as a sponsor or the contact email is already used.",
      });
    }

    await user.update(
      { user_type: "SPONSOR", wallet_address: walletAddress || null },
      { transaction }
    );

    const sponsor = await Sponsor.create(
      {
        email: user.email,
        password: user.password,
        user_id: user.id,
        company_name: companyName,
        logo_url: logoUrl,
        description,
        tier: sponsorTier,
      },
      { transaction }
    );

    await transaction.commit();

    res.status(201).json({
      message:
        "Sponsor registration completed successfully and user profile updated.",
      sponsorId: sponsor.id,
    });
  } catch (error: any) {
    if (transaction) await transaction.rollback();
    console.error("Sponsor registration failed:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message:
          "This user is already registered as a sponsor or the contact email is already used.",
      });
    }

    res.status(500).json({
      message: "An internal server error occurred during registration.",
    });
  }
};

export const getMySponsorProfile = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    const sponsor = await Sponsor.findOne({ where: { user_id: userId } });

    if (!sponsor) {
      return res.status(404).json({ message: "Sponsor profile not found." });
    }

    res.status(200).json(sponsor);
  } catch (error) {
    console.error("Error in getMySponsorProfile:", error);
    res.status(500).json({ message: "Server Error." });
  }
};

export const getAllSponsors = async (req: Request, res: Response) => {
  try {
    const sponsors = await Sponsor.findAll({
      order: [["company_name", "ASC"]],
      attributes: [
        "id",
        "user_id",
        "company_name",
        "logo_url",
        "description",
        "tier",
        "wallet_address",
        "my_fighters",
      ],
    });

    if (sponsors.length === 0) {
      return res.status(404).json({ message: "No sponsors found." });
    }

    res.status(200).json({ sponsors });
  } catch (error) {
    console.error("Error in getAllSponsors:", error);
    res.status(500).json({ message: "Server error retrieving sponsors." });
  }
};
