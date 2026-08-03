// Each charge category lives on exactly one Payment sub-page. "5% on Rented
// Property" is folded into the Service Charge page (it's a one-off billed to
// a resident moving in, not its own nav item) - see CATEGORY_FREQUENCY in
// billing-periods.ts for why it still behaves as one-off there.
export const PAYMENT_PAGES = [
  {
    slug: "service-charge",
    label: "Service Charge",
    categories: ["Service Charge", "5% on Rented Property"],
  },
  { slug: "development-levy", label: "Development Levy", categories: ["Development Levy"] },
  { slug: "toll", label: "Toll", categories: ["Toll"] },
  { slug: "donation", label: "Donation", categories: ["Donation"] },
  { slug: "others", label: "Others", categories: ["Others"] },
] as const;

export function pathForCategory(category: string): string {
  const page = PAYMENT_PAGES.find((p) => (p.categories as readonly string[]).includes(category));
  return page ? `/payment/${page.slug}` : "/payment/others";
}

export const ALL_PAYMENT_PATHS = PAYMENT_PAGES.map((p) => `/payment/${p.slug}`);
