import { Request, Response, NextFunction} from "express";
import jwt from "jsonwebtoken"
import { MyRequest } from "../types/main-types";
import { secret } from "../config";

export default function authMiddleware(req: MyRequest, res: Response, next: NextFunction) {
  if(req.method === "OPTIONS") {
    next();
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];

    if(!token) {
      return res.status(403).json({message: "authentication failed"})  
    } 

    const decodeData = jwt.verify(token, secret)

    req.user = decodeData;
    next();
  } catch (e) {
    console.log(e);
    return res.status(403).json({message: "authentication failed"})
  }
}