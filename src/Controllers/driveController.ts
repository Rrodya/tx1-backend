import { Request, Response } from "express";
import Drive from "../Models/Drive";
import User from "../Models/User";
import jwt from "jsonwebtoken"
import { DriveStatus, RolesEnum, UserStatus } from "../enums";
import { UserType } from "../types/main-types";
import { secret } from "../config";
import getIdFromToken from "../Helpers/getIdFromToken";

interface  JwtPayload {
  id: string;
}

const ATTEMPTS_LIMIT = 3;

class driveController {

  async createDrive (req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
        
      if(!token) {
        return res.json({message: "authorization failed"})
      }

      const { id } = jwt.verify(token, secret) as JwtPayload;      
      
      const passengerUser: any = await User.findOne({_id: id});

      if(!passengerUser) {
        return res.status(400).json({message: "passenger is not exist"});
      }

      if(passengerUser.status !== UserStatus.ACTIVE) {
        return res.json({message: "status error"})
      }

      const driver: any = await findDriver(id, 0);
        
      if(!driver) {
        return res.json({ status: 400, message: "Drivers were not found"});
      }

      const existingDrivePassenger = await Drive.findOne({driver_id: driver._id, passenger_id: id, status: {$nin: [3, 4]}});


      const drive = new Drive({driver_id: driver._id, passenger_id: id, status: DriveStatus.STARTED});
      await drive.save();

      driver.drives.push(drive);
      passengerUser.drives.push(drive);

      await User.findByIdAndUpdate(driver._id, {$push: {drives: drive._id}});
      await User.findByIdAndUpdate(id, {$push: {drives: drive._id}});
      
      const driverUpd: any = await User.findById(driver._id);
      const passengerUpd = await User.findById(id);

      return res.json([driverUpd, passengerUpd]);
    } catch (e) {
      console.log(e);
      res.json(e);
    }
  }

  async waitingDrive (req: Request, res: Response) {
    try {
      const { id } = req.body;

      if(!req.headers.authorization) {
        return res.json({message: "authorization failed"})
      }

      const driverId = getIdFromToken(req.headers.authorization);

      const driver = await User.findOne({_id: driverId});

      if(!driver) {
        return res.json({message: "driver is not found"});
      }

      const drive = await Drive.updateOne({_id: id}, {status: 1});

      return res.json({status_code: "OK", drive_status: 1})
    } catch (error) {
      console.log(error);
      res.json({message: "some error"});
    }
  }
}

async function findDriver (passengerId: string, attempt: number) {
  try {
    const drivers = await User.find({roles: RolesEnum.DRIVER,  status: 1, _id: { $ne: passengerId}});

    if(drivers.length > 0) {
      const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
      return randomDriver;
    }

    while (attempt < ATTEMPTS_LIMIT) {
      const drivers = await User.find({roles: RolesEnum.DRIVER,  status: 1, _id: { $ne: passengerId}});
      
      if(drivers && drivers.length > 0) {
        const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
        return randomDriver;
      }

      attempt++;
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    return null;
  } catch (e) {
    console.log(e);
    return null
  }
}



export default new driveController();