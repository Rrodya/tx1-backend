import { Request, Response } from "express";
import Drive from "../Models/Drive";
import User from "../Models/User";
import Book from "../Models/Book";
import { DriveStatus, PaginationEnum, RolesEnum } from "../enums";
import getIdFromToken from "../Helpers/getIdFromToken";

class driveController {
  async getOne(req: Request, res: Response  ) {
    try {
      const { id } = req.params;
      if(!req.headers.authorization) {
        return res.status(403).json({ message: "Unauthorized"});
      }
      const drive = await Drive.findById(id);      
      const userId = getIdFromToken(req.headers.authorization);
      const user = await User.findById(userId);

      if(!user) {
        return res.status(403).json({ message: "User not found"});
      }

      if(!drive) {
        return res.status(403).json({ message: "Drive not found"});
      }

      const currentDate = new Date
      // currentDate.setHours(currentDate.getHours() - 1);
      const currentDateTime = currentDate.getTime();
      console.log(currentDateTime);
      console.log(drive.date_start);
      if(currentDateTime > drive.date_start) {

        drive.status = DriveStatus.ENDED;
      }

      const driveInfo:any = {isOwning: false};

      driveInfo.isOwning = drive.author_id?.toString() === userId;
      
      if(!driveInfo.isOwning) {
        driveInfo.isBook = drive.passengers_id.includes(userId);
      }

      let books: any = []


      if(userId != drive.author_id) {
        
        driveInfo.aboutUser = {
          id: user._id,
          name: user.name,
          phone: user.phone
        };

        if(driveInfo.isBook){
          const book = await Book.findOne({author_id: userId, drive_id: drive._id});
          if(!book) {
            return res.json({message: "Book not found"});
          }

          driveInfo.aboutUser.description = book.description;
          driveInfo.aboutUser.seats = book.seats;
          driveInfo.aboutUser._id = book._id;
        }
      } else {
        console.log("books");
        let bookUser = await Drive.findById(id).populate("book_id");

        books = bookUser?.book_id;
      }

      return res.json({drive: drive, ...driveInfo, books: books});
    } catch (error) {
      console.log(error);
      return res.json({message: "error"})
    }
  }

  async getAll(req: Request, res: Response  ) {
    try {
      const { page, driverId, from, to } = req.query;
      console.log(page);      
      if(!req.headers.authorization) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = getIdFromToken(req.headers.authorization);
      const user = await User.findById(userId);
      const itemToSkip = (Number(page) - 1) * PaginationEnum.PAGE_SIZE;
      let drives;
      const currentDateTime = new Date().getTime();
      console.log(currentDateTime);
    
      if(!driverId) {
        if(from && to) {
          drives = await Drive.find({status: 0, date_start: { $gt: currentDateTime}, from: from, to: to}).sort({created_at: -1}).skip(itemToSkip).limit(PaginationEnum.PAGE_SIZE);
        } else {
          drives = await Drive.find({status: 0, date_start: { $gt: currentDateTime}}).sort({created_at: -1}).skip(itemToSkip).limit(PaginationEnum.PAGE_SIZE);
        }
        // console.log("drives");
        // console.log(drives);
      } else {
        drives = await Drive.find({ author_id: driverId }).sort({created_at: -1}).skip(itemToSkip).limit(PaginationEnum.PAGE_SIZE);
      }

      let returnDrives = drives.map(drive => {
        return {
          isBook: user?.booked_drives.includes(drive.id),
          drive: drive,
        }
      })

      returnDrives = returnDrives.filter(drive => drive);

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
      const user = await User.findById(driverId);
      const drive = await Drive.findById(id);

      if(!drive) {
        return res.status(400).json({ message: "Driver not found" });
      }

      if(!user) {
        return res.status(400).json({ message: "User not found" });
      }

      if(drive.author_id?.toString() !== driverId && user.roles.includes(RolesEnum.USER)) {
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
      
      data.author_id = user._id;
      data.drive_id = drive.id;
      console.log('book data');
      console.log(data);
      const book = await new Book(data);
      await book.save();

      await user.booked_drives.push(drive._id);
      await user.save();

      await drive.passengers_id.push(user._id);
      await drive.save();

      await drive.book_id.push(book._id);
      await drive.save();

      console.log(drive);


      const bookIds = drive.book_id.map((id: any)=> id)
      console.log(bookIds);
      const drivesBook = await Book.find({_id: {$in: bookIds}})
      console.log(drivesBook);
      const seats = drivesBook.reduce((acc, book) => acc + book.seats, 0);
      console.log(seats);
      drive.booked_seats = seats;
      await drive.save();
      
      return res.json({message: "booked"});
    } catch (error) {
      console.log(error);
      return res.json({message: "error"})
    }
  }

  async cancelToBook(req: Request, res: Response  ) {
    try {
      const { id } = req.params;
      const { passenger_id } = req.body;

      if(!req.headers.authorization) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let userId = getIdFromToken(req.headers.authorization);

      
      const drive = await Drive.findById(id);
      
      if(!drive) {
        return res.json({ message: "Drive not found"});
      }
      console.log("--------")
      
      if(drive.author_id == userId) {
        if(passenger_id) {
          console.log(userId);

          userId = passenger_id;
          console.log(userId);
        }
      }
      

      const book = await Book.findOneAndDelete({author_id: userId, drive_id: id})
      
      if(!book) {
        return res.json({ message: "Book not found"});
      }
      

      



      


      const oldCountSeats = drive.booked_seats;
      const bookedSeatsPerson = book.seats;

      const currBookedSeats = drive.booked_seats - +book.seats;

      await User.updateOne({_id: userId}, { $pull: { booked_drives: id}}, {new: true});
      await Drive.updateOne({_id: id}, { $pull: { passengers_id: userId, book_id: book._id }, booked_seats: currBookedSeats}, {new: true});
      

      return res.json({message: "unbooked"});
    } catch (error) {
      console.log(error);
      return res.json({message: "error"})
    }
  }
}

export default new driveController();   