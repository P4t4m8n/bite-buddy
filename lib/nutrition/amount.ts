/** Largest amount (g or ml) of one food in the calculator and in a meal. */
export const MAX_AMOUNT = 5000;

/** Parses a typed amount. null when it is empty, not a number or negative. */
export const parseAmountInput = (input: string): number | null => {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

/** The amount used for live nutrient math: invalid input counts as 0, large values are capped. */
export const displayAmount = (input: string): number =>
  Math.min(parseAmountInput(input) ?? 0, MAX_AMOUNT);

/** Whether an amount can be saved in a meal (more than 0, at most MAX_AMOUNT). */
export const isSavableAmount = (amount: number | null): amount is number =>
  amount !== null && amount > 0 && amount <= MAX_AMOUNT;
