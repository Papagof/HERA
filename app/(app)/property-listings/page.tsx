import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isStaff } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { labelClass } from "@/components/ui/fieldStyles";
import { createListing, updateListing, deleteListing } from "./actions";

type ListingRow = {
  id: string;
  property_id: string;
  listing_type: string;
  price: number | null;
  size: string | null;
  description: string | null;
  image_urls: string[];
  contact_name: string | null;
  contact_phone: string | null;
  is_published: boolean;
  properties: { street_name: string; house_number: string } | null;
  listing_inquiries: { id: string }[];
};

export default async function PropertyListingsAdminPage() {
  const profile = await requireProfile();
  if (!isStaff(profile.role)) redirect("/dashboard");

  const supabase = await createClient();

  const [{ data: properties }, { data: listings }] = await Promise.all([
    supabase.from("properties").select("id, street_name, house_number").order("street_name"),
    supabase
      .from("property_listings")
      .select(
        "id, property_id, listing_type, price, size, description, image_urls, contact_name, contact_phone, is_published, properties(street_name, house_number), listing_inquiries(id)"
      )
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Property Listings
        </h1>
        <a href="/listings" target="_blank" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          View public page →
        </a>
      </div>

      <Card>
        <form action={createListing} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
            Create listing
          </p>
          <div className="sm:col-span-2">
            <label className={labelClass}>Property</label>
            <Select name="property_id" required defaultValue="">
              <option value="" disabled>
                Select a property
              </option>
              {properties?.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.house_number} {property.street_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className={labelClass}>Listing type</label>
            <Select name="listing_type" defaultValue="rent">
              <option value="rent">For rent</option>
              <option value="sale">For sale</option>
            </Select>
          </div>
          <div>
            <label className={labelClass}>Price</label>
            <Input name="price" type="number" step="0.01" />
          </div>
          <div>
            <label className={labelClass}>Size</label>
            <Input name="size" placeholder="e.g. 3 bedrooms" />
          </div>
          <div>
            <label className={labelClass}>Contact name</label>
            <Input name="contact_name" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description</label>
            <Input name="description" />
          </div>
          <div>
            <label className={labelClass}>Contact phone</label>
            <Input name="contact_phone" />
          </div>
          <div>
            <label className={labelClass}>Image URLs (comma-separated)</label>
            <Input name="image_urls" />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" id="new-publish" name="is_published" />
            <label htmlFor="new-publish" className="text-sm text-slate-700 dark:text-slate-300">
              Publish immediately
            </label>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Create listing</Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        {((listings ?? []) as unknown as ListingRow[]).map((listing) => (
          <Card key={listing.id}>
            <form action={updateListing.bind(null, listing.id)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
                {listing.properties
                  ? `${listing.properties.house_number} ${listing.properties.street_name}`
                  : "Unknown property"}{" "}
                <Badge tone={listing.is_published ? "green" : "slate"}>
                  {listing.is_published ? "Published" : "Draft"}
                </Badge>{" "}
                <span className="text-slate-500 dark:text-slate-400">
                  ({listing.listing_inquiries.length} inquiries)
                </span>
              </p>
              <div>
                <label className={labelClass}>Listing type</label>
                <Select name="listing_type" defaultValue={listing.listing_type}>
                  <option value="rent">For rent</option>
                  <option value="sale">For sale</option>
                </Select>
              </div>
              <div>
                <label className={labelClass}>Price</label>
                <Input name="price" type="number" step="0.01" defaultValue={listing.price ?? ""} />
              </div>
              <div>
                <label className={labelClass}>Size</label>
                <Input name="size" defaultValue={listing.size ?? ""} />
              </div>
              <div>
                <label className={labelClass}>Contact name</label>
                <Input name="contact_name" defaultValue={listing.contact_name ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Description</label>
                <Input name="description" defaultValue={listing.description ?? ""} />
              </div>
              <div>
                <label className={labelClass}>Contact phone</label>
                <Input name="contact_phone" defaultValue={listing.contact_phone ?? ""} />
              </div>
              <div>
                <label className={labelClass}>Image URLs (comma-separated)</label>
                <Input name="image_urls" defaultValue={listing.image_urls.join(", ")} />
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input type="checkbox" id={`publish-${listing.id}`} name="is_published" defaultChecked={listing.is_published} />
                <label htmlFor={`publish-${listing.id}`} className="text-sm text-slate-700 dark:text-slate-300">
                  Published (visible on the public listings page)
                </label>
              </div>
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit">Save</Button>
                <Button type="submit" variant="danger" formAction={deleteListing.bind(null, listing.id)}>
                  Delete
                </Button>
              </div>
            </form>
          </Card>
        ))}
        {(!listings || listings.length === 0) && (
          <Card className="text-center text-slate-500 dark:text-slate-400">No listings yet.</Card>
        )}
      </div>
    </div>
  );
}
