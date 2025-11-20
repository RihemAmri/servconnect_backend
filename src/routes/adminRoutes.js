import express from "express";
import {
  getAllUsers,
  getUserDetails,
  updateUser,
  suspendUser,
  deleteUser,
} from "../controllers/adminController.js";
import { protect, admin } from "../middleware/auth.middleware.js"; // middleware d'authentification

const router = express.Router();

// 🔒 Toutes ces routes nécessitent un admin authentifié
router.use(protect, admin);

router.get("/users", getAllUsers);
router.get("/users/:id", getUserDetails);
router.put("/users/:id", updateUser);
router.patch("/users/:id/suspend", suspendUser);
router.delete("/users/:id", deleteUser);

export default router;
