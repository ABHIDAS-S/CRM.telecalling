const indianNumberFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 1
});

// Presentation only: source values retain their full precision for calculations.
export const formatDisplayNumber = (value) => {
  const number = Number(value);
  return indianNumberFormatter.format(Number.isFinite(number) ? number : 0);
};

export const formatDisplayCurrency = (value) =>
  `₹${formatDisplayNumber(value)}`;
