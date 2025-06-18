const express = require("express");
const bodyParser = require("body-parser");
const supabase = require("./supabaseClient"); // Assuming you have a supabaseClient.js file
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

app.get("/webhook", (req, res) => {
  const verify_token = process.env.VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === verify_token) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});


app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object) {
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const phone = message?.from;
    const text = message?.text?.body?.toLowerCase();

    if (!text || !phone) return res.sendStatus(200);

    // ✅ REGISTER Command
    if (text.startsWith("register")) {
      const name = message.text.body.slice(9).trim(); // Remove "register " and get the name

      if (!name) {
        sendMessage(phone, "⚠️ Please provide your name.\n\nFormat:\nregister Adil Shahan");
        return res.sendStatus(200);
      }

      // Check if already registered
      const { data: existingUser, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .single();

      if (existingUser) {
        sendMessage(phone, `⚠️ You're already registered as ${existingUser.name}`);
        return res.sendStatus(200);
      }

      // Register the new user
      const { error } = await supabase
        .from("users")
        .insert([{ name, phone }]);

      if (error) {
        console.error("❌ Registration failed:", error.message);
        sendMessage(phone, "❌ Something went wrong while registering.");
      } else {
        sendMessage(phone, `✅ ${name}, you have been registered successfully!`);
      }

      return res.sendStatus(200);
    }

    if (text === "present") {
      // 1. Get user by phone number
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("name")
        .eq("phone", phone)
        .single();

      if (userError || !user) {
        sendMessage(phone, "⚠️ Your number is not registered. Please contact admin.");
        return res.sendStatus(200);
      }

      // 2. Save to attendance table
      const { error } = await supabase.from("attendance").insert([
        {
          phone: phone,
          name: user.name,
          status: "present",
          timestamp: new Date().toISOString(),
        },
      ]);

      if (error) {
        console.error("❌ Supabase insert error:", error.message);
        return res.sendStatus(500);
      }

      // 3. Send reply with name
      sendMessage(
        phone,
        `✅ ${user.name}, your attendance is marked!\n📸 Upload your selfie here: https://example.com/upload`
      );
    }
    if (text === "view today") {
  // Get all users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("name, phone");

  if (usersError || !users) {
    sendMessage(phone, "❌ Failed to fetch users.");
    return res.sendStatus(200);
  }

  // Get today's attendance
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const { data: attendanceToday, error: attendanceError } = await supabase
    .from("attendance")
    .select("phone")
    .gte("timestamp", `${todayStr}T00:00:00`)
    .lte("timestamp", `${todayStr}T23:59:59`);

  if (attendanceError || !attendanceToday) {
    sendMessage(phone, "❌ Failed to fetch today's attendance.");
    return res.sendStatus(200);
  }

  const presentPhones = attendanceToday.map((a) => a.phone);

  // Build the message
  let message = `📅 *Today's Attendance:*\n`;

  users.forEach((user) => {
    if (presentPhones.includes(user.phone)) {
      message += `✅ ${user.name} - Present\n`;
    } else {
      message += `❌ ${user.name} - Absent\n`;
    }
  });

  sendMessage(phone, message);
  return res.sendStatus(200);
}


    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});


function sendMessage(to, text) {
    console.log("📤 Attempting to send WhatsApp message to", to);
  const axios = require("axios");
  axios.post(
    `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to: to,
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  ).then(res => {
    console.log("Message sent successfully:", res.data);
  }).catch(err => {
    console.error("Error sending message:", err.response?.data || err.message);
  });
}


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
