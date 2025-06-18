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

    // Continue with existing logic like "present" here...
    
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
