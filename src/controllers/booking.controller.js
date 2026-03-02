import { calendar, sheets } from "../config/google.config.js";

export const bookAppointment = async (req, res) => {
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
};