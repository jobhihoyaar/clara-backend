import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    console.log("ENV CHECK:");
    console.log(
      "GOOGLE_SERVICE_ACCOUNT exists:",
      !!process.env.GOOGLE_SERVICE_ACCOUNT
    );
    console.log("CALENDAR_ID:", process.env.CALENDAR_ID);
    console.log("SHEET_ID:", process.env.SHEET_ID);

    const { name, phone, date, time } = req.body;

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
      return res.json({ available: false });
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

    return res.json({ available: true, booked: true });
  } catch (error) {
    console.error("BOOKING ERROR:", error);
    return res.status(500).json({
      error: "Booking failed",
      details: error.message,
    });
  }
}
