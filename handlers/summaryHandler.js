// handlers/summaryHandler.js
const supabase = require("../supabaseClient");
const sendMessage = require("../utils/sendMessage");
const checkAdminOrOwner = require("../utils/auth");

module.exports = async function summaryHandler(phone, text) {
  const nameQuery = text.slice(7).trim();

  if (!nameQuery) {
    sendMessage(phone, "⚠️ Please provide the employee's name.\n\nExample:\nsummary adil");
    return;
  }

  const isAuthorized = await checkAdminOrOwner(phone);
  if (!isAuthorized) {
    sendMessage(phone, "⛔ You are not authorized to use this command.");
    return;
  }

  const { data: user } = await supabase
    .from("users")
    .select("name, phone")
    .ilike("name", `%${nameQuery}%`)
    .maybeSingle();

  if (!user) {
    sendMessage(phone, `❌ No user found with name "${nameQuery}"`);
    return;
  }

  const userPhone = user.phone;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const firstDay = `${yyyy}-${mm}-01`;
  const lastDay = new Date(yyyy, today.getMonth() + 1, 0);
  const lastDayStr = `${yyyy}-${mm}-${String(lastDay.getDate()).padStart(2, "0")}`;

  const { data: attendance } = await supabase
    .from("attendance")
    .select("timestamp")
    .eq("phone", userPhone)
    .gte("timestamp", `${firstDay}T00:00:00`)
    .lte("timestamp", `${lastDayStr}T23:59:59`);

  const presentDates = new Set(
    attendance.map((a) => a.timestamp.split("T")[0])
  );

  const presentCount = presentDates.size;
  const totalDaysInMonth = lastDay.getDate();
  const absentCount = totalDaysInMonth - presentCount;

  sendMessage(
    phone,
    `📊 ${today.toLocaleString("default", { month: "long" })} Summary for ${user.name}:\n` +
    `✅ Present Days: ${presentCount}\n` +
    `❌ Absent Days: ${absentCount}`
  );
};
