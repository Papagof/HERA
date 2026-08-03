import { CategoryPaymentPage } from "../CategoryPaymentPage";
import { PAYMENT_PAGES } from "@/lib/payment-pages";

export default function OthersPage({
  searchParams,
}: {
  searchParams: Promise<{ payer?: string }>;
}) {
  return (
    <CategoryPaymentPage
      categories={PAYMENT_PAGES[4].categories}
      title="Others"
      description="A one-off, ad hoc charge from either a resident or a landlord that doesn't fit the other categories."
      showCoverage={false}
      searchParams={searchParams}
    />
  );
}
