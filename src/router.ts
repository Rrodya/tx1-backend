import { Router, Request, Response } from "express";

import authContorller from "./Controllers/authContorller";
import userController from "./Controllers/userController";
import driveController from "./Controllers/driveController";
import fileController from "./Controllers/fileController";

import { check } from "express-validator";
import authMiddleware from "./middleware/authMiddleware";
import roleMiddleware from "./middleware/roleMiddleware";
import { RolesEnum } from "./enums";

const router = Router();


//Auth

router.post("/auth/log", authContorller.login);
router.post("/auth/reg", [
    check("name", "Имя пользователя не может быть пустым").notEmpty(),
    check("password", "Пароль должен быть больше 4 и меньше 2000 символов").isLength({min: 4, max: 20})
],authContorller.registration);
router.get("/auth/check-role", roleMiddleware([RolesEnum.USER, RolesEnum.ADMIN]) as any, authContorller.checkRole),
router.get("/auth/users", roleMiddleware([RolesEnum.USER]) as any, authContorller.getUsers);
router.post("/auth/create-admin", authContorller.createAdmin); 
router.post("/auth/create-roles", authContorller.createRole);

//User

router.get("/user/profile", roleMiddleware([RolesEnum.USER]) as any, userController.getMyProfile);
router.get("/user/:id", roleMiddleware([RolesEnum.ADMIN, RolesEnum.USER], ) as any, userController.getOne);
router.get("/users", roleMiddleware([RolesEnum.ADMIN]) as any, userController.getAll);
router.put("/user", roleMiddleware([RolesEnum.USER]) as any, userController.updateOne);
router.get("/user/download/:id", fileController.createFile);

//Drive

//getting

router.get("/drives", roleMiddleware([RolesEnum.USER, RolesEnum.ADMIN]) as any, driveController.getAll);
router.get("/drive/:id", roleMiddleware([RolesEnum.USER, RolesEnum.ADMIN]) as any, driveController.getOne);

//create, update, delete, cancel

router.post("/drive", roleMiddleware([RolesEnum.USER]) as any, driveController.create);
router.put("/drive", roleMiddleware([RolesEnum.USER]) as any, driveController.update);
router.delete("/drive/:id", roleMiddleware([RolesEnum.ADMIN]) as any, driveController.delete);
router.post("/drive/cancel/:id", roleMiddleware([RolesEnum.USER]) as any, driveController.cancel);

//to book, unbook

router.post("/drive/to-book/:id", roleMiddleware([RolesEnum.USER]) as any, driveController.toBook);
router.post("/drive/cancel-to-book/:id", roleMiddleware([RolesEnum.USER]) as any, driveController.cancelToBook);

export default router;  