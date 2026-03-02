import express from "express";
import { bookAppointment } from "../controllers/booking.controller.js";

const router = express.Router();

router.post("/book", bookAppointment);

export default router;