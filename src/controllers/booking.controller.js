import { calendar, sheets } from "../config/google.config.js";

export const bookAppointment = async (req, res) => {
  try {
    const {
      name,
      phone,
      date,
      time,
      direction = "Outbound",
      status = "Completed",
      receiver = process.env.TWILIO_NUMBER || "+14150000000",
      transcript,
      durationSeconds
    } = req.body;

    if (!name || !phone || !date || !time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const timeZone = "America/New_York";

    const startDateTime = new Date(`${date}T${time}:00`);
    const endDateTime = new Date(startDateTime.getTime() + 30 * 60000);

    // Calendar booking
    await calendar.events.insert({
      calendarId: process.env.CALENDAR_ID,
      resource: {
        summary: `Appointment - ${name}`,
        description: `Phone: ${phone}`,
        start: { dateTime: startDateTime, timeZone },
        end: { dateTime: endDateTime, timeZone },
      },
    });

    // --- Demo Data Generation ---

    const callDuration = durationSeconds || Math.floor(Math.random() * 300) + 120; // 2–7 mins
    const minutes = (callDuration / 60).toFixed(2);

    const twilioCost = (minutes * 0.013).toFixed(3);      // approx US outbound
    const elevenCost = (minutes * 0.018).toFixed(3);      // sample AI voice rate
    const totalCost = (parseFloat(twilioCost) + parseFloat(elevenCost)).toFixed(3);

    const fakeTranscript =
      transcript ||
      `Agent: Hi ${name}, this is regarding your booking inquiry.\n` +
      `Customer: Yes, I'd like to confirm the appointment on ${date} at ${time}.\n` +
      `Agent: Perfect. Your appointment is confirmed.\n` +
      `Customer: Thank you.\n` +
      `Call ended successfully.`;

    const summary =
      `Call with ${name} regarding appointment booking. ` +
      `Confirmed slot for ${date} at ${time}. ` +
      `Customer sounded interested and confirmed details.`;

    /*
      SHEET STRUCTURE:
      A  Caller
      B  Receiver
      C  Direction
      D  Call Status
      E  Name of the customer
      F  Phone number
      G  Date of appoint
      H  Time of appoint
      I  Call Transcript
      J  Call Summary
      K  Call Duration
      L  Twilio Pricing
      M  Eleven labs
      N  Total Cost
    */

    const row = [
      phone,                 // Caller
      receiver,              // Receiver
      direction,             // Direction
      status,                // Call Status
      name,                  // Customer Name
      phone,                 // Phone number
      date,                  // Date
      time,                  // Time
      fakeTranscript,        // Transcript
      summary,               // Summary
      `${callDuration}s`,    // Duration
      `$${twilioCost}`,      // Twilio Pricing
      `$${elevenCost}`,      // Eleven Labs
      `$${totalCost}`        // Total Cost
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: "Sheet1!A:N",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: { values: [row] },
    });

    res.json({
      success: true,
      message: "Booking created and sheet populated",
      totalCost
    });

  } catch (error) {
    console.error("BOOKING ERROR:", error);
    res.status(500).json({
      error: "Booking failed",
      details: error.message,
    });
  }
};