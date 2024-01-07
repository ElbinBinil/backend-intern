import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/signup").post(upload.single("profileImage"), registerUser);
router.route("/login").post(loginUser);

//🔐 protected routes
router.route("/logout").post(verifyJWT, logoutUser);

export default router;
