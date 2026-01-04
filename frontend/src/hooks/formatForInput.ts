export const formatForInput = (isoString: string) => {
  if (!isoString) return "";

  const date = new Date(isoString);
  return date.toISOString().slice(0, 16);
};
