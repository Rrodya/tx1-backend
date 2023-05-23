import { Router, Request, Response } from "express";

import authContorller from "./Controllers/authContorller";
import driverController from "./Controllers/driverController";
import passengerController from "./Controllers/passangerController";
import driveController from "./Controllers/driveController";

import { check } from "express-validator";
import authMiddleware from "./middleware/authMiddleware";
import roleMiddleware from "./middleware/roleMiddleware";
import { RolesEnum } from "./enums";

const router = Router();

router.post("/auth/log", authContorller.login);
router.post("/auth/reg", [
    check("name", "Имя пользователя не может быть пустым").notEmpty(),
    check("password", "Пароль должен быть больше 4 и меньше 2000 символов").isLength({min: 4, max: 20})
],authContorller.registration);
router.get("/auth/check-role", roleMiddleware([RolesEnum.DRIVER, RolesEnum.PASSENGER]) as any, authContorller.checkRole),
router.get("/auth/users", roleMiddleware([RolesEnum.DRIVER]) as any, authContorller.getUsers);
router.post("/auth/create-admin", authContorller.createAdmin); 
router.post("/auth/create-roles", authContorller.createRole);
router.get("/auth/user-info", roleMiddleware([RolesEnum.DRIVER, RolesEnum.PASSENGER]) as any, authContorller.getUserInfo);

router.post("/driver/find-order", roleMiddleware([RolesEnum.DRIVER]) as any, driverController.findOrder);
router.post("/driver/accept-order", roleMiddleware([RolesEnum.DRIVER]) as any, driverController.acceptOrder);
router.post("/driver/finish-drive", roleMiddleware([RolesEnum.DRIVER]) as any, driverController.finishOrder)


router.post("/passenger/find-taxi", roleMiddleware([RolesEnum.PASSENGER]) as any, passengerController.findTaxi);
router.post("/passenger/cancel-find-taxi", roleMiddleware([RolesEnum.PASSENGER]) as any, passengerController.cancelFindTaxi);
router.post("/passenger/wait-end-drive", roleMiddleware([RolesEnum.PASSENGER]) as any, passengerController.waitEndDrive)
export default router;  