import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { isAdmin } from "../middlewares/admin.middleware.js";
import {
  createAdmin,
  deleteUser,
  getAllUser,
  modifyDetails,
} from "../controllers/admin.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/admin-create").post(upload.single("profileImage"), createAdmin);
router.route("/users").get(isAdmin, getAllUser);
router.route("/modify-details").post(isAdmin, verifyJWT, modifyDetails);
router.route("/delete").delete(isAdmin, verifyJWT, deleteUser);
export default router;
