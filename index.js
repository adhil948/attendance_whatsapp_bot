const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
const app = express();
app.use(bodyParser.json());

const registerHandler = require("./handlers/registerHandler");
const attendanceHandler = require("./handlers/attendanceHandler");
const viewTodayHandler = require("./handlers/viewTodayHandler");
const summaryHandler = require("./handlers/summaryHandler");

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  const message = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  const phone = message?.from;
  const text = message?.text?.body?.toLowerCase();

  if (!text || !phone) return res.sendStatus(200);

  if (text.startsWith("register")) await registerHandler(phone, text);
  else if (text === "present") await attendanceHandler(phone);
  else if (text === "view today") await viewTodayHandler(phone);
  else if (text.startsWith("summary")) await summaryHandler(phone, text);

  return res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
