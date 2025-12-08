import { Request, Response } from "express";
import Fighter from "../models/Fighter";

export const getGlobeData = async (req: Request, res: Response) => {
  try {
    const fighters = await Fighter.findAll({
      attributes: [
        "country",
        [
          Fighter.sequelize!.fn("COUNT", Fighter.sequelize!.col("id")),
          "fighterCount",
        ],
      ],
      where: { status: "verified" },
      group: ["country"],
    });

    const globeData = fighters.map((f) => ({
      country: f.country,
      fighterCount: Number(f.getDataValue("fighterCount")),
    }));

    res.status(200).json(globeData);
  } catch (error) {
    console.error("getGlobeData Sequelize error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
