// handlers/registerHandler.js
const supabase = require("../supabaseClient");
const sendMessage = require("../utils/sendMessage");

module.exports = async function registerHandler(phone, text) {
  const name = text.slice(9).trim();

  if (!name) {
    sendMessage(phone, "⚠️ Please provide your name.\n\nFormat:\nregister Adil Shahan");
    return;
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("phone", phone)
    .single();

  if (existingUser) {
    sendMessage(phone, `⚠️ You're already registered as ${existingUser.name}`);
    return;
  }

  const { error } = await supabase
    .from("users")
    .insert([{ name, phone, role: "employee" }]);

  if (error) {
    console.error("❌ Registration failed:", error.message);
    sendMessage(phone, "❌ Something went wrong while registering.");
  } else {
    sendMessage(phone, `✅ ${name}, you have been registered successfully!`);
  }
};
