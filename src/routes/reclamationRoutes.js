import express from "express";
import {
  addReclamation,
  getUserReclamations,
  getAllReclamations,
  respondReclamation,
} from "../controllers/reclamationController.js";

const router = express.Router();

// Routes accessibles par le client
router.post("/", addReclamation);
router.get("/me", getUserReclamations);

// Routes admin
router.get("/", getAllReclamations);
router.patch("/:id/respond", respondReclamation);

export default router;
