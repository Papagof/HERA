import { redirect } from "next/navigation";

export default function PaymentIndexRedirect() {
  redirect("/payment/service-charge");
}
