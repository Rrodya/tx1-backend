import { Request, Response } from "express";
import User from "../Models/User";
import jwt from "jsonwebtoken";
import { DriveStatus, UserStatus } from "../enums";
import { secret } from "../config";
import getIdFromToken from "../Helpers/getIdFromToken";
import Drive from "../Models/Drive";
import changeUserStatus from "../Helpers/changeUserStatus";

interface JwtPayload {
  id: string;
}

async function checkActiveDrives(driverId: string) {
  let user = await User.findById(driverId);
  if (!user) {
    return null;
  }

  let attempt = 0;

  while (attempt < 100) {
    attempt++;

    let user = await User.findById(driverId);
    if (!user) {
      return null;
    }
    let driveId = user.drives[user.drives.length - 1];

    let drive = await Drive.findById(driveId);

    if (!drive) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      continue;
    }

    if (drive.status == DriveStatus.STARTED) {
      return drive;
    }
  }

  return null;
}

class driverController {
  async finishOrder(req: Request, res: Response) {
    try {
      const { driveId, status } = req.body;

      if (!req.headers.authorization) {
        return res.json({ message: "authorization failed" });
      }
      
      console.log("finish drive status -- " + status);
      if(status == DriveStatus.DONE) {
        const drive = await Drive.findByIdAndUpdate(driveId, {
          status: DriveStatus.DONE,
        });

        console.log(drive);
      }
    } catch (error) {
      console.log(error);
      res.json({ message: "error with finish drive", error: error });
    }
  }
  async acceptOrder(req: Request, res: Response) {
    try {
      const { status, driveId } = req.body;

      if (!req.headers.authorization) {
        return res.json({ message: "authorization failed" });
      }

      const driverId = getIdFromToken(req.headers.authorization);
      console.log("status " + status);
      console.log("enum status " + DriveStatus.STARTED);
      console.log("user status " + UserStatus.UNACTIVE);
      if (status === DriveStatus.DRIVING) {
        const updDrive = await Drive.findByIdAndUpdate(driveId, {
          status: DriveStatus.DRIVING,
        });
        const passenger = await User.findById(updDrive?.passenger_id);
        console.log("UPDDRIVER AFTER ACCEIPT");
        return res.json({
          drive: {
            id: updDrive?._id,
            from: updDrive?.from_address,
            to: updDrive?.to_address,
          },
          passenger: {
            name: passenger?.name,
            phone: passenger?.phone,
          },
        });
      }

      return res.json({ message: "drive was canceled" });
    } catch (error) {
      console.log(error);
      res.sendStatus(400).json({ message: "accept drive error" });
    }
  }

  async findOrder(req: Request, res: Response) {
    try {
      if (!req.headers.authorization) {
        return res.json({ message: "authorization failed" });
      }

      const driverId = getIdFromToken(req.headers.authorization);

      const user = await changeUserStatus(driverId, UserStatus.ACTIVE);
      const drive = await checkActiveDrives(driverId);

      if (!drive) {
        await changeUserStatus(driverId, UserStatus.UNACTIVE);
        return res.json({ message: "error found drive" });
      }

      return res.json({
        id: drive._id,
        from: drive.from_address,
        to: drive.to_address,
      });
    } catch (e) {
      console.log(e);
      res.json(e);
    }
  }
}

async function findOrder(driverId: string) {
  const driver = await User.findById(driverId);

  if (!driver) {
    return null;
  }

  console.log(driver.drives);

  const drives: Array<typeof Drive> = [];

  driver.drives.forEach((item) => {});
}

export default new driverController();
