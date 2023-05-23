import { Request, Response } from "express";
import Role from "../Models/Role";
import { RolesEnum } from "../enums";
import User from "../Models/User";
import bcryptjs from "bcryptjs"
import { validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { MyRequest } from "../types/main-types";
import { secret } from "../config";
import getIdFromToken from "../Helpers/getIdFromToken";
import { JwtPayload } from "jsonwebtoken";


const generateAccessToken = (id: string, roles: string[]) => {
  const payload = {
    id,
    roles,
  }

  return jwt.sign(payload, secret, {expiresIn: "24h"});
}

class authController {
  async registration (req: Request, res: Response) {
    try {
      const errors = validationResult(req );
      
      if(!errors.isEmpty()) {
        return res.status(400).json({message: "Registration error validation", errors})
      }

      const { phone, password, name, role, car } = req.body;
    

      if(!Object.keys(RolesEnum).includes(role)) {
        return res.status(404).json({message: "error with choosing role"})
      }

      const candidate = await User.findOne({phone});

      if(candidate) {
        const existingRoles = candidate.roles || [];
        const newRoles = [RolesEnum.PASSENGER, RolesEnum.DRIVER];
        
        const rolesToAdd = newRoles.filter(role => !existingRoles.includes(role));
        if(rolesToAdd.length < 2 && RolesEnum[rolesToAdd[0]] === RolesEnum[role as keyof typeof RolesEnum]) {
          await User.updateOne({_id: candidate._id}, {$addToSet: { roles: rolesToAdd}})
          const user = await User.findById(candidate._id);
          return res.status(200).json(user)
        }

        return res.status(400).json(
          {
            message: "User with this number already exist",
            error: "wrong login",
          }
        )
      }

      const hashPassword = bcryptjs.hashSync(password, 7);
      const userRole = await Role.findOne({ value: RolesEnum[role as keyof typeof RolesEnum]})

      if(!userRole) {
        return res.status(404).json({message: "can't find this role"}) ;
      }

      const user = new User({phone, name, password: hashPassword, car: car, roles: [userRole.value]})
      await user.save();
      return res.json(user)

    } catch(e) {
      console.log(e);
      res.status(400).json({message: "Registration error"})
    }
  }


  async login(req: Request, res: Response) {
    try {
      const { phone, password, roles } = req.body;
      
      const user = await User.findOne({phone});
      if(!user) {
        return res.status(400).json({message: "wrong login"})
      }
      const userRoles: string[] = user.roles;
      const role = roles[0];

      console.log(role);
      console.log(userRoles);
      if(!userRoles.includes(role)) {
        return res.status(200).json({message: "incorrect role"});
      }

      const validPassord = bcryptjs.compareSync(password, user.password);

      if(!validPassord) {
        return res.status(400).json({message: "Password is incorrect"})
      }

      const token = generateAccessToken(user._id.toString(), user.roles);
      return res.status(200).json({token: token})
    } catch(e) {
      console.log(e);
      res.status(400).json({message: "Login error"})
    }
  }

  async getUsers(req: Request, res: Response) {
    try {
      const users = await User.find();
      res.json(users)
    } catch(e) {
      res.json(e);
    }
  }

  async createAdmin(req: Request, res: Response) {
    try {
      const { phone, password} = req.body;
      const hashPassword = bcryptjs.hashSync(password, 7);
      const user = new User({phone, password: hashPassword, roles: [RolesEnum.ADMIN]})
      user.save();
      res.json(user);
    } catch (error) {
      console.log(error);
      res.json({message: "find error"})
    }
  }

  async createRole(req: Request, res: Response) {
    try {
      const userRole = new Role();
      const driverRole = new Role({value: RolesEnum.DRIVER});
      const adminRole = new Role({value: RolesEnum.ADMIN});

      await userRole.save();
      await driverRole.save();
      await adminRole.save();

      return res.json("success");
    } catch (error) {
      console.log(error);
      res.json("error of createing role");
    }
  }

  async checkRole(req: Request, res: Response) {
    try {
      if(!req.headers.authorization) {
        return res.json({message: "authorization failed"})
      }

      const token = req.headers.authorization.split(" ")[1];
      const { roles } = jwt.verify(token, secret) as JwtPayload;
      console.log("role");
      console.log(roles);
      res.json({message: roles});
    } catch (e) {
      console.log(e);
      res.send(400);
    }
  }

  async getUserInfo(req: Request, res: Response) {
    try {
      if(!req.headers.authorization) {
        return res.json({message: "authorization failed"})
      }

      const userId = getIdFromToken(req.headers.authorization);

      const user = await User.findById(userId);

      if(!user) {
        return res.sendStatus(400).json({message: "user not found"})
      }

      return res.json({
        name: user.name,
        phone: user.phone,
        car: user.car,
        drives: user.drives
      });
    } catch(e) {
      console.log(e);
      res.sendStatus(400);
    }
  }
}

export default new authController();