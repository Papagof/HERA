export const BILLING_PERIODS = [
  { value: "monthly", label: "Monthly" },
  { value: "bi_monthly", label: "Bi-monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half_yearly", label: "Half-yearly" },
  { value: "yearly", label: "Yearly" },
] as const;

// How many calendar months a payment of this period covers, starting from
// (and including) its chosen starting month.
export const MONTHS_COVERED: Record<string, number> = {
  monthly: 1,
  bi_monthly: 2,
  quarterly: 3,
  half_yearly: 6,
  yearly: 12,
};
