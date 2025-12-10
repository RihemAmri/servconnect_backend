import express from "express";
import { askChatbot } from "../controllers/chatbot.controller.js";

const router = express.Router();
router.post("/", askChatbot);
export default router;
