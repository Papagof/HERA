import { CategoryPaymentPage } from "../CategoryPaymentPage";
import { PAYMENT_PAGES } from "@/lib/payment-pages";

export default function TollPage({
  searchParams,
}: {
  searchParams: Promise<{ payer?: string }>;
}) {
  return (
    <CategoryPaymentPage
      categories={PAYMENT_PAGES[2].categories}
      title="Toll"
      description="A daily charge that can be paid by either a resident or a landlord."
      showCoverage={false}
      searchParams={searchParams}
    />
  );
}
