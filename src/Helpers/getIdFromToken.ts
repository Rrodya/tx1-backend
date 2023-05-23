import jwt, { JwtPayload } from "jsonwebtoken";
import { secret } from "../config";


export default function decodeJwt (encodedToken: string) {
  const token = encodedToken.split(" ")[1];
  const { id } = jwt.verify(token, secret) as JwtPayload;
  return id;
}