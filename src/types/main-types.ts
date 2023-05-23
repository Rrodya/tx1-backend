import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface UserType {
    id: string;
    name: string;
    login: string;
    password: string;
}

export interface MyRequest extends Request {
    user: JwtPayload | string;
}

