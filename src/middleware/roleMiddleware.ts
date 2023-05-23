import { MyRequest } from "../types/main-types"
import { Response, NextFunction } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import { secret } from "../config";

export default function roleMiddleware(roles: string[]) {
  return function (req: MyRequest, res: Response, next: NextFunction) {
    if(req.method === "OPTIONS") {
      next();
    }
  
    try {
      const token = req.headers.authorization?.split(' ')[1];
  
      if(!token) {
        return res.status(403).json({message: "jwt token not found"})  
      } 
      console.log("is status ------------------");
      console.log(token);
      console.log(secret);
      const jwtEncoded  = jwt.verify(token, secret) as JwtPayload & { roles: string[] };
      
      const { roles: userRoles } = jwtEncoded;
      let hasRole = false;

      userRoles.forEach(role => {
        if(roles.includes(role)) {
          hasRole = true;
        }
      })

      if(!hasRole) {
        return res.status(403).json({message: "you don't have rights"})
      }

      next();
    } catch (e) {
      console.log(e);
      return res.status(403).json({message: "authentication failed"})
    }
  }
}