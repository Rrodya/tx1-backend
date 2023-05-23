import { Request, Response } from "express";
import User from "../Models/User";
import jwt from "jsonwebtoken";
import { UserStatus } from "../enums";
import { secret } from "../config";
import getIdFromToken from "../Helpers/getIdFromToken";
import changeUserStatus from "../Helpers/changeUserStatus";
import Drive from "../Models/Drive";
import { DriveStatus } from "../enums";
import { RolesEnum } from "../enums";
import changeDriveStatus from "../Helpers/changeDriveStatus";

enum FindTaxiErrors {
  DRIVERS_NOT_FOUND = "Drivers were not found",
  FIND_TAXI_CANCELLED = "Find taxi cancelled",
}

interface JwtPayload {
  id: string;
}

const ATTEMPTS_LIMIT = 100;

class passengerController {
  async findTaxi(req: Request, res: Response) {
    try {
      const { from, to } = req.body;

      if (!req.headers.authorization) {
        return res.status(200).json({ message: "authorization failed" });
      }

      const passengerId = getIdFromToken(req.headers.authorization);

      const passenger = await changeUserStatus(passengerId, UserStatus.ACTIVE);

      if (!passenger) {
        return res.status(400).json({ message: "passenger is not exist" });
      }

      if (passenger.status !== UserStatus.ACTIVE) {
        return res.json({ message: "status error" });
      }

      const driver: any = await findDriver(passengerId, 0);
      console.log(driver);

      if (!driver) {
        await changeUserStatus(passengerId, UserStatus.UNACTIVE);
        return res.json({
          status: 400,
          message: FindTaxiErrors.DRIVERS_NOT_FOUND,
        });
      }

      if (driver === FindTaxiErrors.FIND_TAXI_CANCELLED) {
        return res.json({
          status: 200,
          message: FindTaxiErrors.FIND_TAXI_CANCELLED,
        });
      }

      const existingDrivePassenger = await Drive.findOne({
        driver_id: driver._id,
        passenger_id: passengerId,
        status: { $nin: [2, 3] },
      });
      if (existingDrivePassenger) {
        await changeUserStatus(passengerId, UserStatus.UNACTIVE);
        return res.status(400).json({ message: "Drive already exists" });
      }

      const drive = new Drive({
        driver_id: driver._id,
        passenger_id: passengerId,
        status: DriveStatus.STARTED,
        from_address: from,
        to_address: to,
      });

      await drive.save();

      await User.findByIdAndUpdate(driver._id, {
        $push: { drives: drive._id },
      });
      await User.findByIdAndUpdate(passengerId, {
        $push: { drives: drive._id },
      });

      const driverUpd: any = await User.findById(driver._id);
      const passengerUpd = await User.findById(passengerId);

      const acceptedDrive = await waitingAcceptDrive(driverUpd, drive._id);
      console.log(acceptedDrive);
      if (!acceptedDrive) {
        await changeUserStatus(passengerId, UserStatus.UNACTIVE);
        return res.json({ message: "error found driver" });
      }

      if (acceptedDrive.status === "driver not found") {
        await changeUserStatus(passengerId, UserStatus.UNACTIVE);
        return res.json({ message: "driver not found" });
      }

      if (acceptedDrive.status === "accept") {
        return res.json({ driver: driverUpd, drive: drive });
      }

      return res.json({ message: "error found driver" });
    } catch (e) {
      console.log(e);
      res.json(e);
    }
  }

  async cancelFindTaxi(req: Request, res: Response) {
    try {
      if (!req.headers.authorization) {
        return res.status(200).json({ message: "authorization failed" });
      }

      const passengerId = getIdFromToken(req.headers.authorization);

      const passenger = await changeUserStatus(
        passengerId,
        UserStatus.UNACTIVE
      );

      if (!passenger) {
        return res.status(400).json({ message: "passenger is not exist" });
      }

      return res.json({ status: 0 });

      console.log(passenger);
    } catch (error) {
      console.log(error);
      res.json(error);
    }
  }

  async waitEndDrive(req: Request, res: Response) {
    try {
      const { driveId, passengeId } = req.body;

      if(!req.headers.authorization) {
        return res.status(200).json({ message: "authorization failed" });
      }

      const waitedEndDrive = await waitingEndDrive(driveId);

      if(!waitedEndDrive) {
        return res.status(400).json({ message: "drive was too long and was canceled" });
      }
      
      const passenger = await changeUserStatus(
        passengeId,
        UserStatus.UNACTIVE
      );
      
      return res.json({ message: "drive is done", status: 0})

    } catch (error) {
      console.log(error);
      return res.json({ message: "error for finish drive" });
    }
  }
}

async function waitingEndDrive(driveId: string) {
  try {
    const drive = await Drive.findOne({ _id: driveId });
    const waitingAttempt = 1000;

    if (!drive) {
      return false;
    }

    if (drive.status !== DriveStatus.DRIVING) {
      return false;
    }

    let attempt = 0;

    while (attempt < waitingAttempt) {
      const checkDrive = await Drive.findOne({ _id: driveId });

      if (!checkDrive) {
        return false;
      }

      if (checkDrive.status === DriveStatus.DONE) {
        return true;
      }

      attempt++;
    }
    return true;  
  } catch (error) {
    console.log(error);
    return false;
  }
}

async function findDriver(passengerId: string, attempt: number) {
  try {
    console.log("here is we will found waiting accept drive");
    const drivers = await User.find({
      roles: RolesEnum.DRIVER,
      status: 1,
      _id: { $ne: passengerId },
    });

    if (drivers.length > 0) {
      const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
      return randomDriver;
    }

    while (attempt < ATTEMPTS_LIMIT) {
      const drivers = await User.find({
        roles: RolesEnum.DRIVER,
        status: 1,
        _id: { $ne: passengerId },
      });

      const passenger = await User.findById(passengerId);

      if (!passenger) {
        return FindTaxiErrors.FIND_TAXI_CANCELLED;
      }

      if (passenger.status === UserStatus.UNACTIVE) {
        return FindTaxiErrors.FIND_TAXI_CANCELLED;
      }

      if (drivers && drivers.length > 0) {
        const randomDriver =
          drivers[Math.floor(Math.random() * drivers.length)];

        return randomDriver;
      }

      attempt++;

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    return null;
  } catch (e) {
    console.log(e);
    return null;
  }
}

async function waitingAcceptDrive(driver: any, driveId: any) {
  try {
    console.log("this is is user");
    let attempt = 0;

    while (attempt < 10) {
      attempt++;

      const userDriver = await User.findById(driver._id);

      if (!userDriver) {
        return null;
      }

      const drives = userDriver.drives;

      if (!drives) {
        return null;
      }

      // const currentDriveIndex = drives.findIndex(driveId);

      // const currentDriveId = drives[currentDriveIndex];

      const currentDrive = await Drive.findById(driveId);

      if (!currentDrive) {
        return null;
      }
      console.log("current status - " + currentDrive.status);

      if (currentDrive.status === DriveStatus.DRIVING) {
        return {
          status: "accept",
        };
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    return {
      status: "driver not found",
    };
  } catch (error) {
    console.log(error);
    return null;
  }
}

export default new passengerController();
