// utils/sendMessage.js
const axios = require("axios");

module.exports = function sendMessage(to, text) {
  console.log("📤 Sending WhatsApp message to", to);

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
    console.log("✅ Message sent:", res.data);
  }).catch(err => {
    console.error("❌ Message failed:", err.response?.data || err.message);
  });
};
