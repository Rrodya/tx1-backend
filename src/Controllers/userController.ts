import { Request, Response } from "express";
import User from "../Models/User";
import getIdFromToken from "../Helpers/getIdFromToken";
import { PaginationEnum } from "../enums";
import Drive from "../Models/Drive";
import { RolesEnum } from "../enums";

class userController {
  async getMyProfile(req: Request, res: Response) {
    try {
      if (!req.headers.authorization) {
        return res.status(401).json({ error: "Token not provided" });
      }
  
      const id = getIdFromToken(req.headers.authorization);
  
      const user = await User.findById(id);
      if(!user) {
        return res.json({})
      }

      if(!user) {
        return res.status(404).json({ error: "user not found" });
      }

      const userBooks = await Drive.find({author_id: user._id})
      console.log(userBooks);

      
      return res.json({my_drives: userBooks, user: user});
    } catch (error) {
      console.log(error);
      return res.json({message: "error"});
    }
  }

  async getOne(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if(!req.headers.authorization) {
        return res.status(403).json({message: "authorization failed"});
      }

      const userId = getIdFromToken(req.headers.authorization)
      const reqUser = await User.findById(userId);

      const response: any = {};

      // if(reqUser?.roles.includes(RolesEnum.ADMIN)){
        let ownDrives = await User.findById(id).populate({ path: "my_drives"});
        console.log("--------------------------------")
        ownDrives?.my_drives.reverse() 
        console.log("--------------------------------")

        let bookedDrives = await User.findById(id).populate({ path: "booked_drives"});
        bookedDrives?.booked_drives.reverse()
        response.bookedDrives = bookedDrives?.booked_drives;
        response.ownDrives = ownDrives?.my_drives;
      // }

      

      const user = await User.findById(id);

      if(!user) {
        return res.json({ status: 404, message:"User not found"})
      }

      response.user = user;

      return res.json(response);
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