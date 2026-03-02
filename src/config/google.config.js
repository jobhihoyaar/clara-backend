import { google } from "googleapis";

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

export const calendar = google.calendar({ version: "v3", auth });
export const sheets = google.sheets({ version: "v4", auth });