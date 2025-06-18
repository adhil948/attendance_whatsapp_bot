// handlers/attendanceHandler.js
const supabase = require("../supabaseClient");
const sendMessage = require("../utils/sendMessage");

module.exports = async function attendanceHandler(phone) {
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("name")
    .eq("phone", phone)
    .single();

  if (userError || !user) {
    sendMessage(phone, "⚠️ Your number is not registered. Please contact admin.");
    return;
  }

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
    sendMessage(phone, "❌ Failed to mark your attendance.");
    return;
  }

  sendMessage(
    phone,
    `✅ ${user.name}, your attendance is marked!\n📸 Upload your selfie here: https://example.com/upload`
  );
};
