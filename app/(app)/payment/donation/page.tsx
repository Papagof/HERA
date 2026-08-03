import { CategoryPaymentPage } from "../CategoryPaymentPage";
import { PAYMENT_PAGES } from "@/lib/payment-pages";

export default function DonationPage({
  searchParams,
}: {
  searchParams: Promise<{ payer?: string }>;
}) {
  return (
    <CategoryPaymentPage
      categories={PAYMENT_PAGES[3].categories}
      title="Donation"
      description="A one-off, ad hoc contribution from either a resident or a landlord."
      showCoverage={false}
      searchParams={searchParams}
    />
  );
}
