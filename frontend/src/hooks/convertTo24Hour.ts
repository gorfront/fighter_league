export const convertTo24Hour = (timeStr: string) => {
  if (!timeStr) return "";

  if (!timeStr.toLowerCase().includes("m")) return timeStr;
  const cleanStr = timeStr.toLowerCase().trim();

  const isPM = cleanStr.includes("pm");
  // eslint-disable-next-line prefer-const
  let [hours, minutes] = cleanStr.replace(/(am|pm)/g, "").split(":");

  if (!minutes) minutes = "00";

  let hourNum = parseInt(hours, 10);

  if (hourNum === 12) {
    hourNum = isPM ? 12 : 0;
  } else if (isPM) {
    hourNum += 12;
  }

  return `${hourNum.toString().padStart(2, "0")}:${minutes}`;
};
