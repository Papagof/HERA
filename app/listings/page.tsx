import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type ListingRow = {
  id: string;
  listing_type: string;
  price: number | null;
  size: string | null;
  description: string | null;
  properties: { street_name: string; house_number: string; block: string | null } | null;
};

export default async function PublicListingsPage() {
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("property_listings")
    .select("id, listing_type, price, size, description, properties(street_name, house_number, block)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
        Available Properties
      </h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">
        Properties currently for rent or sale within the estate.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {((listings ?? []) as unknown as ListingRow[]).map((listing) => (
          <Link key={listing.id} href={`/listings/${listing.id}`}>
            <Card className="h-full transition-colors hover:border-indigo-400 dark:hover:border-indigo-500">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {listing.properties
                    ? `${listing.properties.house_number} ${listing.properties.street_name}`
                    : "Property"}
                </p>
                <Badge tone="indigo">{listing.listing_type === "rent" ? "For rent" : "For sale"}</Badge>
              </div>
              {listing.price && (
                <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {listing.price}
                </p>
              )}
              {listing.size && (
                <p className="text-sm text-slate-500 dark:text-slate-400">{listing.size}</p>
              )}
              {listing.description && (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                  {listing.description}
                </p>
              )}
            </Card>
          </Link>
        ))}
        {(!listings || listings.length === 0) && (
          <Card className="col-span-full text-center text-slate-500 dark:text-slate-400">
            No properties are currently listed.
          </Card>
        )}
      </div>
    </div>
  );
}
