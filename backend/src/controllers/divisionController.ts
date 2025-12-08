import { Request, Response } from "express";
import Division from "../models/Division";

export const getAllDivisions = async (req: Request, res: Response) => {
  try {
    const divisions = await Division.findAll({
      attributes: ["id", "gender", "name", "min_weight", "max_weight"],
      order: [["id", "ASC"]],
    });

    res.status(200).json(divisions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
