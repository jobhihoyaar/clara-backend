import express from "express";
import dotenv from "dotenv";
import bookingRoutes from "./routes/booking.routes.js";
import voiceRoutes from "./routes/voice.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", bookingRoutes);
app.use("/api", voiceRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "Server running 🚀",
    timestamp: new Date(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});