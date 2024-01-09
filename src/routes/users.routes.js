import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  modifyName,
  modifyImage,
  deleteUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/signup").post(upload.single("profileImage"), registerUser);
router.route("/login").post(loginUser);

//🔐 protected routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/modify-name").post(verifyJWT, modifyName);
router
  .route("/modify-image")
  .patch(verifyJWT, upload.single("profileImage"), modifyImage);
router.route("/delete").delete(verifyJWT, deleteUser);

export default router;
