import express from "express";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ==================================================
   GOOGLE AUTH SETUP
================================================== */

if (!process.env.GOOGLE_PRIVATE_KEY) {
  console.error("❌ GOOGLE_PRIVATE_KEY missing");
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/spreadsheets",
  ],
});

const calendar = google.calendar({ version: "v3", auth });
const sheets = google.sheets({ version: "v4", auth });

/* ==================================================
   HEALTH CHECK
================================================== */

app.get("/", (req, res) => {
  res.json({
    status: "Server running 🚀",
    timestamp: new Date(),
  });
});

/* ==================================================
   BOOK APPOINTMENT
================================================== */

app.post("/book", async (req, res) => {
  try {
    const { name, phone, date, time } = req.body;

    if (!name || !phone || !date || !time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const timeZone = "America/New_York";

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

    const events = await calendar.events.list({
      calendarId: process.env.CALENDAR_ID,
      timeMin: startDateTime.toISOString(),
      timeMax: endDateTime.toISOString(),
      singleEvents: true,
    });

    if (events.data.items.length > 0) {
      return res.json({ available: false, message: "Slot already booked" });
    }

    await calendar.events.insert({
      calendarId: process.env.CALENDAR_ID,
      resource: {
        summary: `Appointment - ${name}`,
        description: `Phone: ${phone}`,
        start: { dateTime: startDateTime, timeZone },
        end: { dateTime: endDateTime, timeZone },
      },
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!A:D",
      valueInputOption: "RAW",
      resource: {
        values: [[name, phone, date, time]],
      },
    });

    res.json({ available: true, booked: true });

  } catch (error) {
    console.error("BOOKING ERROR:", error);
    res.status(500).json({
      error: "Booking failed",
      details: error.message,
    });
  }
});

/* ==================================================
   TWILIO VOICE WEBHOOK
================================================== */

app.post("/voice", (req, res) => {
  res.type("text/xml");

  const twiml = `
<Response>
  <Connect>
    <Stream url="wss://api.elevenlabs.io/v1/convai/stream/agent_5301khk6t6xwecgtmf6bz7zyx0gb">
      <Parameter name="agent_id" value="agent_5301khk6t6xwecgtmf6bz7zyx0gb" />
    </Stream>
  </Connect>
</Response>
  `;

  res.send(twiml);
});

/* ==================================================
   START SERVER
================================================== */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});