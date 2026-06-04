export const uid      = () => Math.random().toString(36).slice(2, 9);
export const nowTime  = () => new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
export const todayStr = () => new Date().toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" });
export const calcScore = (sub) => {
  let s = 0;
  if (sub.before.length > 0) s += 30;
  if (sub.after.length  > 0) s += 30;
  if (sub.note && sub.note.length > 20) s += 25;
  if (sub.before.length >= 3 && sub.after.length >= 3) s += 15;
  return Math.min(s, 100);
};
