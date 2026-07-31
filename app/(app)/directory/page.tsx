import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isStaff } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { ESTATE_STREETS } from "@/lib/streets";

type PropertyRow = {
  id: string;
  street_name: string;
  house_number: string;
  block: string | null;
  type: string;
  status: string;
  resident_count: number;
  landlords: { full_name: string }[];
  residents: { full_name: string }[];
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ street?: string; status?: string; landlord?: string }>;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  // Landlords/residents land on their own unit directly rather than the
  // full searchable directory, which is a staff-facing tool.
  if (profile.role === "landlord") {
    const { data } = await supabase
      .from("landlords")
      .select("property_id")
      .eq("profile_id", profile.id)
      .limit(1)
      .maybeSingle();

    if (data) redirect(`/directory/${data.property_id}`);
  }

  if (profile.role === "resident") {
    const { data } = await supabase
      .from("residents")
      .select("property_id")
      .eq("profile_id", profile.id)
      .limit(1)
      .maybeSingle();

    if (data) redirect(`/directory/${data.property_id}`);
  }

  const { street, status, landlord } = await searchParams;

  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, street_name, house_number, block, type, status, resident_count, landlords(full_name), residents(full_name)")
    .order("street_name")
    .order("house_number");

  if (error) throw new Error(error.message);

  const filtered = ((properties ?? []) as PropertyRow[]).filter((property) => {
    if (street && !property.street_name.toLowerCase().includes(street.toLowerCase())) {
      return false;
    }
    if (status && property.status !== status) return false;
    if (
      landlord &&
      !property.landlords.some((l) => l.full_name.toLowerCase().includes(landlord.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const canAdd = isStaff(profile.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          Resident & Landlord Directory
        </h1>
        {canAdd && (
          <Link href="/directory/new" className={buttonClasses("primary")}>
            Add property
          </Link>
        )}
      </div>

      <Card>
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select name="street" defaultValue={street ?? ""}>
            <option value="">All streets</option>
            {ESTATE_STREETS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <Select name="status" defaultValue={status ?? ""}>
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="rented">Rented</option>
            <option value="sold">Sold</option>
          </Select>
          <Input name="landlord" placeholder="Filter by landlord name" defaultValue={landlord ?? ""} />
          <div className="sm:col-span-3">
            <Button type="submit">Apply filters</Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 && (
          <Card className="text-center text-slate-500 dark:text-slate-400">
            No properties match these filters.
          </Card>
        )}
        {filtered.map((property) => (
          <Link key={property.id} href={`/directory/${property.id}`}>
            <Card className="transition-colors hover:border-indigo-400 dark:hover:border-indigo-500">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900 dark:text-slate-100">
                    {property.house_number} {property.street_name}
                    {property.block ? `, Block ${property.block}` : ""}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Landlord: {property.landlords.map((l) => l.full_name).join(", ") || "—"} ·
                    {" "}Residents ({property.resident_count}): {property.residents.map((r) => r.full_name).join(", ") || "—"}
                  </p>
                </div>
                <Badge tone={property.status === "available" ? "green" : "slate"}>
                  {property.status}
                </Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
