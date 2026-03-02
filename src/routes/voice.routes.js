import express from "express";
import { voiceWebhook } from "../controllers/voice.controller.js";

const router = express.Router();

router.post("/voice", voiceWebhook);

export default router;