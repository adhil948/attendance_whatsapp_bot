// handlers/viewTodayHandler.js
const supabase = require("../supabaseClient");
const sendMessage = require("../utils/sendMessage");
const checkAdminOrOwner = require("../utils/auth");

module.exports = async function viewTodayHandler(phone) {
  const isAuthorized = await checkAdminOrOwner(phone);
  if (!isAuthorized) {
    sendMessage(phone, "⛔ You are not authorized to use this command.");
    return;
  }

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("name, phone");

  if (usersError || !users) {
    sendMessage(phone, "❌ Failed to fetch users.");
    return;
  }

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
    return;
  }

  const presentPhones = attendanceToday.map((a) => a.phone);
  let message = `📅 *Today's Attendance (${todayStr}):*\n`;

  users.forEach((user) => {
    if (presentPhones.includes(user.phone)) {
      message += `✅ ${user.name} - Present\n`;
    } else {
      message += `❌ ${user.name} - Absent\n`;
    }
  });

  sendMessage(phone, message);
};
