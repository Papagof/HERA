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

// Each charge category has a fixed billing rhythm - not a staff choice:
// Service Charge is always monthly, Development Levy is a one-off assessed
// per plot, Toll is daily, and Donation/Others/5% on Rented Property are
// ad hoc one-off entries with no recurring schedule.
export const CATEGORY_FREQUENCY: Record<string, string> = {
  "Service Charge": "monthly",
  "Development Levy": "one_off",
  Toll: "daily",
  "5% on Rented Property": "one_off",
  Donation: "one_off",
  Others: "one_off",
};
