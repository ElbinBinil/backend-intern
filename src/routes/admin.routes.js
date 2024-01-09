import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import { createAdmin, getAllUser } from "../controllers/admin.controller.js";
const router = Router();

router.route("/admin-create").post(upload.single("profileImage"), createAdmin);
router.route("/users").get(isAdmin, getAllUser);
export default router;
