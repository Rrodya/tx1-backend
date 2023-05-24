import { Request, Response } from "express";
import Drive from "../Models/Drive";
import User from "../Models/User";
import { PaginationEnum } from "../enums";
import getIdFromToken from "../Helpers/getIdFromToken";

class driveController {
  async getOne(req: Request, res: Response  ) {
    try {
      const { id } = req.params;
      const drive = await Drive.findById(id);

      return res.json(drive);
    } catch (error) {
      console.log(error);
      return res.json({message: "error"})
    }
  }

  async getAll(req: Request, res: Response  ) {
    try {
      const { page, driverId } = req.body;
      
      if(!req.headers.authorization) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = getIdFromToken(req.headers.authorization);
      const user = await User.findById(userId);
      const itemToSkip = (page - 1) * PaginationEnum.PAGE_SIZE;
      let drives;
      if(!driverId) {
        // drives = await Drive.find({$expr: { $lt: [ {$size: "$passengers_id"}, "$seats"]}}).skip(itemToSkip).limit(PaginationEnum.PAGE_SIZE);
        drives = await Drive.find().skip(itemToSkip).limit(PaginationEnum.PAGE_SIZE);
      } else {
        drives = await Drive.find({ author_id: driverId }).skip(itemToSkip).limit(PaginationEnum.PAGE_SIZE);
      }

      let returnDrives = drives.map(drive => {
        return {
          isBook: user?.booked_drives.includes(drive.id),
          drive: drive,
        }
      })

      returnDrives = returnDrives.filter(drive => drive);

      console.log(returnDrives);

      return res.json({ drives: returnDrives, userId: userId });
    } catch (error) {    
      console.log(error);
      return res.json({message: "error"})
    }
  }

  async create(req: Request, res: Response  ) {
    try {
      if(!req.headers.authorization) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const id = getIdFromToken(req.headers.authorization);
      const driveInfo = req.body;
      driveInfo.author_id = id;
      const drive = await new Drive(driveInfo);
      await drive.save();
  
      const driver = await User.findById(id);
      
      if(!driver) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      driver.my_drives.push(drive._id);
      await driver.save();
      return res.json(drive);
    } catch (error) {
      console.log(error);
      return res.json({message: "error"})
    }
  }

  async cancel(req: Request, res: Response  ) {
    try {
      const { id } = req.params;

      if(!req.headers.authorization) {
        return res.status(401).json({ message: "Unauthorized"});
      }
      const userId = getIdFromToken(req.headers.authorization);
      const user = await User.findById(userId);
      const drive = await Drive.findById(id);
      
      if(!user) {
        return res.status(404).json({message: "User not found"});
      }

      if(!drive) {
        return res.status(404).json({message: "Drive not found"});
      }

      if(drive.author_id?.toString() !== user._id.toString()) {
        return res.json({message: "Ivalid driver id"})
      }

      await Drive.findByIdAndUpdate(id, { status: 1 });
      
      return res.json({message: "success"});
    } catch (error) {
      console.log(error);
      return res.json({message: "error"})
    }
  }

  async delete(req: Request, res: Response  ) {
    try {
      const { id } = req.params;
      if(!req.headers.authorization) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const driverId = getIdFromToken(req.headers.authorization);
      const drive = await Drive.findById(id);

      if(!drive) {
        return res.status(400).json({ message: "Driver not found" });
      }

      if(drive.author_id?.toString() !== driverId) {
        return res.json({message: "Invalid driver id" });
      }

      const deletedDrive = await Drive.findByIdAndDelete(id);
      
      if(!deletedDrive) {
        return res.status(401).json({ message: "drive not found"});
      }

      const driver = await User.findById(driverId);
      if(!driver) {
        return res.status(401).json({ message: "user not found"});
      }
      
      await User.updateMany({$or: [{ booked_drives: deletedDrive._id }, { my_drives: deletedDrive._id }]}, { $pull: { my_drives: deletedDrive._id, booked_drives: deletedDrive._id }}, { new: true });
      return res.json({message: "success"});
    } catch (error) {
      console.log(error);
      return res.json({message: "error"})
    }
  }

  async update(req: Request, res: Response  ) {
    try {
      const drive = req.body;
      const updatedDrive = await Drive.findByIdAndUpdate(drive._id, drive, { new: true });
      return res.json(updatedDrive);
    } catch (error) {    
      console.log(error);
      return res.json({message: "error"})
    }
  }

  async toBook(req: Request, res: Response  ) {
    try {
      const { id } = req.params;
      const data = req.body;
      
      if(!req.headers.authorization) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = getIdFromToken(req.headers.authorization);
      const user = await User.findById(userId);
      const drive = await Drive.findById(id);

      if(!drive) {
        return res.status(401).json({ message: "Drive not found" });
      }

      if(!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if(userId! == drive.author_id) {
        return res.status(401).json({ message: "Can't book this drive" });
      }

      if(drive.seats <= drive.passengers_id.length) {
        return res.status(401).json({ message: "Seats limit exceeded" });
      }

      const passenger = {
        _id: user._id,
        seats: data.seats,
        description: data.description,
        phone: data.phone 
      }

      user.booked_drives.push(drive._id);
      user.save();

      drive.passengers.push(passenger);
      drive.save();

      drive.passengers_id.push(user._id);
      drive.save();

      console.log(drive);
      
      return res.json({message: "booked", });
    } catch (error) {
      console.log(error);
      return res.json({message: "error"})
    }
  }

  async cancelToBook(req: Request, res: Response  ) {
    try {
      const { id } = req.params;

      if(!req.headers.authorization) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = getIdFromToken(req.headers.authorization);
    
      await User.updateOne({_id: userId}, { $pull: { booked_drives: id}}, {new: true});
      await Drive.updateOne({_id: id}, { $pull: { passengers_id: userId }}, {new: true});

      return res.json({message: "unbooked"});
    } catch (error) {
      console.log(error);
      return res.json({message: "error"})
    }
  }
}

export default new driveController();