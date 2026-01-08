import countryData from "@/assets/country.json";

export const getFlagComponent = (countryName: string) => {
  const found = countryData.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) =>
      c.name.toLowerCase() === countryName.toLowerCase() ||
      (countryName === "Russia" && c.name === "Russian Federation")
  );

  if (found && found.code) {
    return (
      <img
        src={`https://flagcdn.com/w40/${found.code.toLowerCase()}.png`}
        alt={countryName}
        className="h-4 w-6 object-cover rounded-sm shadow-sm inline-block"
        title={countryName}
      />
    );
  }

  return <span className="w-6 h-4 overflow-hidden">🏳️</span>;
};
