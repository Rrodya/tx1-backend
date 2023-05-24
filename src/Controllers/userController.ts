import { Request, Response } from "express";
import User from "../Models/User";
import getIdFromToken from "../Helpers/getIdFromToken";
import { PaginationEnum } from "../enums";


class userController {
  async getMyProfile(req: Request, res: Response) {
    try {
      if (!req.headers.authorization) {
        return res.status(401).json({ error: "Token not provided" });
      }
  
      const id = getIdFromToken(req.headers.authorization);
  
      const user = await User.findOne({
        where: {
          id,
        },
      });
  
      return res.json(user);
    } catch (error) {
      console.log(error);
      return res.json({message: "error"});
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;

    const user = await User.findOne({
      where: {
        id,
      },
    });

    return res.json(user);
    } catch (error) {
      console.log(error);
      return res.json({message: "error"});
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const { page } = req.body;
      const itemToSkip = (page - 1) * PaginationEnum.PAGE_SIZE;
      const users = await User.find().skip(itemToSkip).limit(PaginationEnum.PAGE_SIZE);
      return res.json(users);
    } catch (error) {
      console.log(error);
      return res.json({message: "error"});
    }
  }

  async updateOne(req: Request, res: Response) {
    try {
      const user = req.body;
      const updatedUser = await User.findOneAndUpdate(user._id, user, { new: true });
  
      return res.json(updatedUser);
    } catch (error) {
      console.log(error);
      return res.json({message: "error"});
    }
  }
}

export default new userController();