import XLSX from "xlsx";
import User from "../Models/User";
import Drive from "../Models/Drive";
import Book from "../Models/Book";
import { Request, Response } from "express";

function getAllBooks(drives: any) {
  let price = 0;
  drives.forEach((drive: any) => {
    price += drive.price * drive.booked_seats;
  })

  return price;
}

class fileController {
  async createFile(req: Request, res: Response) {
    try {
      console.log("start download");
      const {id} = req.params;



      const user: any = await User.findById(id).populate(["my_drives", "booked_drives"]);
      if(!user) {
        return res.status(404).json({message: "User not found."});
      }

      const myDrives = user.my_drives.map((drive: any) => ({
        'Дата': drive.created_at.toString(),
        'Цена': drive.price,
        'От': drive.from,
        'Куда': drive.to,
        'Количество пассажиров': drive.booked_seats
      }));
      
      const bookedDrives = user.booked_drives.map((drive: any) => ({
        'Дата': drive.created_at.toString(),
        'Цена': drive.price,
        'От': drive.from,
        'Куда': drive.to,
        'Количество пассажиров': drive.booked_seats
      }));

      const userRows = [
          { 'Имя': user.name ,
          'Телефон': user.phone ,
           'Общее количество пассажирских поездок': user.my_drives.length ,
           'Общее количество водительских поездок': user.booked_drives.length ,
           'Потраченная сумма':user.booked_drives.reduce((acc: number, item: any) => acc + item.price, 0),
           'Заработанная сумма': getAllBooks(user.my_drives),
        }
      ]


      const wb = XLSX.utils.book_new();


      const userSheet = XLSX.utils.json_to_sheet(userRows);
      const myDrivesSheet = XLSX.utils.json_to_sheet(myDrives);
      const bookedDrivesSheet = XLSX.utils.json_to_sheet(bookedDrives);

      // XLSX.utils.book_append_sheet(wb, sheet, user.name);
      XLSX.utils.book_append_sheet(wb, userSheet, user.name);
      XLSX.utils.book_append_sheet(wb, myDrivesSheet, "Водитель");
      XLSX.utils.book_append_sheet(wb, bookedDrivesSheet, "Пассажир");
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      res.set(`Content-Disposition', 'attachment; filename=${user.name}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.log(error)
    }
  }
}

export default new fileController();