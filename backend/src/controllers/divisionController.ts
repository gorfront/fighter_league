import { Request, Response } from "express";
import Division from "../models/Division";
import { asyncHandler } from "../utils/errorHandling";

export const getAllDivisions = asyncHandler(async (req: Request, res: Response) => {
  const divisions = await Division.findAll({
    attributes: ["id", "gender", "name", "min_weight", "max_weight"],
    order: [["id", "ASC"]],
  });

  res.status(200).json(divisions);
});
