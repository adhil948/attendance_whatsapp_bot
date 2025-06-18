// utils/auth.js
const supabase = require("../supabaseClient");

module.exports = async function checkAdminOrOwner(phone) {
  const { data: sender, error } = await supabase
    .from("users")
    .select("role")
    .eq("phone", phone)
    .single();

  if (error || !sender) return false;
  return ["admin", "owner"].includes(sender.role);
};
