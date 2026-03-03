import { Request, Response } from "express";
import Fighter from "../models/Fighter";
import { asyncHandler } from "../utils/errorHandling";

export const getGlobeData = asyncHandler(async (req: Request, res: Response) => {
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
});
