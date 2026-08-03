import { CategoryPaymentPage } from "../CategoryPaymentPage";
import { PAYMENT_PAGES } from "@/lib/payment-pages";

export default function ServiceChargePage({
  searchParams,
}: {
  searchParams: Promise<{ payer?: string }>;
}) {
  return (
    <CategoryPaymentPage
      categories={PAYMENT_PAGES[0].categories}
      title="Service Charge"
      description="Monthly service charge billed to the resident occupying an apartment, plus the one-off 5% on Rented Property charge for new residents moving in."
      showCoverage
      searchParams={searchParams}
    />
  );
}
