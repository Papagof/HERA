import { CategoryPaymentPage } from "../CategoryPaymentPage";
import { PAYMENT_PAGES } from "@/lib/payment-pages";

export default function DevelopmentLevyPage({
  searchParams,
}: {
  searchParams: Promise<{ payer?: string }>;
}) {
  return (
    <CategoryPaymentPage
      categories={PAYMENT_PAGES[1].categories}
      title="Development Levy"
      description="A one-off charge billed to landlords, sized by the number of plots they own (minimum half a plot)."
      showCoverage={false}
      searchParams={searchParams}
    />
  );
}
