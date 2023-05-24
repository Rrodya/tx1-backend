import { Router, Request, Response } from "express";

import authContorller from "./Controllers/authContorller";
import userController from "./Controllers/userController";
import driveController from "./Controllers/driveController";

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
router.get("/auth/check-role", roleMiddleware([RolesEnum.DRIVER, RolesEnum.PASSENGER]) as any, authContorller.checkRole),
router.get("/auth/users", roleMiddleware([RolesEnum.DRIVER]) as any, authContorller.getUsers);
router.post("/auth/create-admin", authContorller.createAdmin); 
router.post("/auth/create-roles", authContorller.createRole);

//User

router.get("/user/profile", roleMiddleware([RolesEnum.USER]) as any, userController.getMyProfile);
router.get("/user/:id", roleMiddleware([RolesEnum.USER]) as any, userController.getOne);
router.get("/users", roleMiddleware([RolesEnum.USER]) as any, userController.getAll);
router.put("/user", roleMiddleware([RolesEnum.USER]) as any, userController.updateOne);

//Drive

//getting

router.get("/drives", roleMiddleware([RolesEnum.USER]) as any, driveController.getAll);
router.get("/drive/:id", roleMiddleware([RolesEnum.USER]) as any, driveController.getOne);

//create, update, delete, cancel

router.post("/drive", roleMiddleware([RolesEnum.USER]) as any, driveController.create);
router.put("/drive", roleMiddleware([RolesEnum.USER]) as any, driveController.update);
router.delete("/drive/:id", roleMiddleware([RolesEnum.USER]) as any, driveController.delete);
router.post("/drive/:id/cancel", roleMiddleware([RolesEnum.USER]) as any, driveController.cancel);

//to book

router.post("/drive/:id/to-book", roleMiddleware([RolesEnum.USER]) as any, driveController.toBook);
router.post("/drive/:id/cancel-to-book", roleMiddleware([RolesEnum.USER]) as any, driveController.cancelToBook);

export default router;  