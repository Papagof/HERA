import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { labelClass } from "@/components/ui/fieldStyles";
import { formatCurrency } from "@/lib/currency";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { submitInquiry } from "../actions";

export default async function PublicListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  const { sent } = await searchParams;
  const supabase = await createClient();

  const { data: listing } = await supabase
    .from("property_listings")
    .select("*, properties(street_name, house_number, block)")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!listing) notFound();

  const property = listing.properties as { street_name: string; house_number: string; block: string | null } | null;
  const propertyLabel = property
    ? `${property.house_number} ${property.street_name}${property.block ? `, Block ${property.block}` : ""}`
    : "your listing";
  const contactPhone = listing.contact_phone;
  const listingType = listing.listing_type;

  // The inquiry is still saved for the staff-facing count on the Property
  // Listings page, but there's no email/SMS notification system yet - the
  // one way this actually reaches the contact person right away is handing
  // it straight to them on WhatsApp, so redirect there when a number is on
  // file instead of just showing a "we'll be in touch" confirmation.
  async function sendInquiry(formData: FormData) {
    "use server";
    await submitInquiry(id, formData);

    if (contactPhone) {
      const name = String(formData.get("name") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim();
      const phone = String(formData.get("phone") ?? "").trim();
      const message = String(formData.get("message") ?? "").trim();

      const whatsappMessage = [
        `Hi, I'm interested in ${propertyLabel} (${listingType === "rent" ? "for rent" : "for sale"}).`,
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : null,
        message ? `Message: ${message}` : null,
      ]
        .filter((line): line is string => line !== null)
        .join("\n");

      redirect(buildWhatsAppLink(contactPhone, whatsappMessage));
    }

    redirect(`/listings/${id}?sent=1`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {property ? `${property.house_number} ${property.street_name}` : "Property"}
            {property?.block ? `, Block ${property.block}` : ""}
          </h1>
          <Badge tone="indigo">{listing.listing_type === "rent" ? "For rent" : "For sale"}</Badge>
        </div>
        {listing.price && (
          <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(listing.price)}
          </p>
        )}
        {listing.size && <p className="text-slate-500 dark:text-slate-400">{listing.size}</p>}
        {listing.description && (
          <p className="mt-4 text-slate-700 dark:text-slate-300">{listing.description}</p>
        )}
        {listing.image_urls.length > 0 && (
          <ul className="mt-4 list-disc pl-5 text-sm text-indigo-600 dark:text-indigo-400">
            {listing.image_urls.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        )}
        {(listing.contact_name || listing.contact_phone) && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Contact: {listing.contact_name ?? "—"} {listing.contact_phone ? `· ${listing.contact_phone}` : ""}
          </p>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">
          Interested? Send an inquiry
        </h2>
        {sent === "1" ? (
          <div className="text-center">
            <p className="text-emerald-600 dark:text-emerald-400">
              Thanks — your inquiry has been sent. We&rsquo;ll be in touch.
            </p>
            <Link href="/" className={`mt-6 inline-flex ${buttonClasses("secondary")}`}>
              Back to home
            </Link>
          </div>
        ) : (
          <form action={sendInquiry} className="space-y-4">
            <div>
              <label className={labelClass}>Name</label>
              <Input name="name" required />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <Input name="email" type="email" required />
            </div>
            <div>
              <label className={labelClass}>Phone (optional)</label>
              <Input name="phone" />
            </div>
            <div>
              <label className={labelClass}>Message</label>
              <Textarea name="message" rows={4} />
            </div>
            <Button type="submit">Send inquiry</Button>
          </form>
        )}
      </Card>
    </div>
  );
}
