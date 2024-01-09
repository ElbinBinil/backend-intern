import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createAdmin } from "../controllers/admin.controller.js";
const router = Router();

router.route("/admin-create").post(upload.single("profileImage"), createAdmin);

export default router;
