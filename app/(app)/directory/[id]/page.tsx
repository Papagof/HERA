import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, isStaff } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { labelClass } from "@/components/ui/fieldStyles";
import { ESTATE_STREETS } from "@/lib/streets";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import {
  updateProperty,
  deleteProperty,
  upsertLandlord,
  deleteLandlord,
  createResident,
  updateResident,
  moveOutResident,
} from "@/app/(app)/directory/actions";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();
  const canEdit = isStaff(profile.role);
  const canSeeHistory = ["super_admin", "executive_current", "executive_past"].includes(
    profile.role
  );

  const { data: property } = await supabase.from("properties").select("*").eq("id", id).single();
  if (!property) notFound();

  const [{ data: landlords }, { data: residents }, { data: history }, { data: estateWideGroup }] = await Promise.all([
    supabase.from("landlords").select("*").eq("property_id", id),
    supabase.from("residents").select("*").eq("property_id", id).order("full_name"),
    canSeeHistory
      ? supabase.from("occupancy_history").select("*").eq("property_id", id).order("end_date", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    supabase.from("community_groups").select("invite_url").eq("key", "estate_wide").maybeSingle(),
  ]);

  const landlord = landlords?.[0] ?? null;
  const groupInviteUrl = estateWideGroup?.invite_url ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {property.house_number} {property.street_name}
          {property.block ? `, Block ${property.block}` : ""}
        </h1>
        <Badge tone={property.status === "available" ? "green" : "slate"}>{property.status}</Badge>
      </div>

      {/* Property details */}
      <Card>
        <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">Property</h2>
        {canEdit ? (
          <form action={updateProperty.bind(null, property.id)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Street name</label>
              <Select name="street_name" defaultValue={property.street_name} required>
                {!(ESTATE_STREETS as readonly string[]).includes(property.street_name) && (
                  <option value={property.street_name}>{property.street_name} (current)</option>
                )}
                {ESTATE_STREETS.map((street) => (
                  <option key={street} value={street}>
                    {street}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className={labelClass}>House/unit number</label>
              <Input name="house_number" defaultValue={property.house_number} required />
            </div>
            <div>
              <label className={labelClass}>Block</label>
              <Input name="block" defaultValue={property.block ?? ""} />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <Select name="type" defaultValue={property.type}>
                <option value="occupied">Occupied</option>
                <option value="rent">For rent</option>
                <option value="sale">For sale</option>
                <option value="both">Rent or sale</option>
              </Select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <Select name="status" defaultValue={property.status}>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="rented">Rented</option>
                <option value="sold">Sold</option>
              </Select>
            </div>
            <div className="flex items-end gap-2 sm:col-span-2">
              <Button type="submit">Save property</Button>
              <Button
                type="submit"
                variant="danger"
                formAction={deleteProperty.bind(null, property.id)}
              >
                Delete property
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500 dark:text-slate-400">Type</dt>
            <dd className="text-slate-900 dark:text-slate-100">{property.type}</dd>
          </dl>
        )}
      </Card>

      {/* Landlord */}
      <Card>
        <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">Landlord</h2>
        {canEdit ? (
          <form
            action={upsertLandlord.bind(null, property.id, landlord?.id ?? null)}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label className={labelClass}>Full name</label>
              <Input name="full_name" defaultValue={landlord?.full_name ?? ""} required />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <Input name="phone" defaultValue={landlord?.phone ?? ""} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <Input name="email" type="email" defaultValue={landlord?.email ?? ""} />
            </div>
            <div>
              <label className={labelClass}>WhatsApp number</label>
              <Input name="whatsapp_number" defaultValue={landlord?.whatsapp_number ?? ""} />
            </div>
            <div>
              <label className={labelClass}>ID document URL</label>
              <Input name="id_document_url" defaultValue={landlord?.id_document_url ?? ""} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Ownership proof URL</label>
              <Input name="ownership_proof_url" defaultValue={landlord?.ownership_proof_url ?? ""} />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
              <Button type="submit">{landlord ? "Save landlord" : "Add landlord"}</Button>
              {landlord && (
                <Button
                  type="submit"
                  variant="danger"
                  formAction={deleteLandlord.bind(null, property.id, landlord.id)}
                >
                  Remove landlord
                </Button>
              )}
              {landlord?.whatsapp_number && groupInviteUrl && (
                <a
                  href={buildWhatsAppLink(
                    landlord.whatsapp_number,
                    `Hi ${landlord.full_name}, here's the invite link to our estate WhatsApp group: ${groupInviteUrl}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Invite to WhatsApp group →
                </a>
              )}
            </div>
          </form>
        ) : landlord ? (
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500 dark:text-slate-400">Name</dt>
            <dd className="text-slate-900 dark:text-slate-100">{landlord.full_name}</dd>
            <dt className="text-slate-500 dark:text-slate-400">Phone</dt>
            <dd className="text-slate-900 dark:text-slate-100">{landlord.phone ?? "—"}</dd>
          </dl>
        ) : (
          <p className="text-sm text-slate-500 dark:text-slate-400">No landlord on record.</p>
        )}
      </Card>

      {/* Residents */}
      <Card>
        <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">
          Residents ({property.resident_count})
        </h2>
        <div className="space-y-4">
          {residents?.map((resident) => (
            <div key={resident.id} className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
              {canEdit ? (
                <form action={updateResident.bind(null, property.id, resident.id)} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input name="full_name" defaultValue={resident.full_name} required />
                  <Input name="phone" defaultValue={resident.phone ?? ""} placeholder="Phone" />
                  <Input name="email" type="email" defaultValue={resident.email ?? ""} placeholder="Email" />
                  <Input
                    name="whatsapp_number"
                    defaultValue={resident.whatsapp_number ?? ""}
                    placeholder="WhatsApp number"
                  />
                  <Select name="relationship" defaultValue={resident.relationship}>
                    <option value="owner-occupier">Owner-occupier</option>
                    <option value="tenant">Tenant</option>
                    <option value="family">Family</option>
                  </Select>
                  <Input name="move_in_date" type="date" defaultValue={resident.move_in_date ?? ""} />
                  <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                    <Button type="submit">Save</Button>
                    <Button
                      type="submit"
                      variant="secondary"
                      formAction={moveOutResident.bind(null, property.id, resident.id)}
                    >
                      Move out
                    </Button>
                    {resident.whatsapp_number && groupInviteUrl && (
                      <a
                        href={buildWhatsAppLink(
                          resident.whatsapp_number,
                          `Hi ${resident.full_name}, here's the invite link to our estate WhatsApp group: ${groupInviteUrl}`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-emerald-600 hover:underline dark:text-emerald-400"
                      >
                        Invite to WhatsApp group →
                      </a>
                    )}
                  </div>
                </form>
              ) : (
                <div className="text-sm">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{resident.full_name}</p>
                  <p className="text-slate-500 dark:text-slate-400">
                    {resident.relationship} · {resident.phone ?? "—"}
                  </p>
                </div>
              )}
            </div>
          ))}
          {(!residents || residents.length === 0) && (
            <p className="text-sm text-slate-500 dark:text-slate-400">No current residents.</p>
          )}
        </div>

        {canEdit && (
          <form action={createResident.bind(null, property.id)} className="mt-6 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 dark:border-slate-800 sm:grid-cols-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">Add resident</p>
            <Input name="full_name" placeholder="Full name" required />
            <Input name="phone" placeholder="Phone" />
            <Input name="email" type="email" placeholder="Email" />
            <Input name="whatsapp_number" placeholder="WhatsApp number" />
            <Select name="relationship" defaultValue="tenant">
              <option value="owner-occupier">Owner-occupier</option>
              <option value="tenant">Tenant</option>
              <option value="family">Family</option>
            </Select>
            <Input name="move_in_date" type="date" />
            <Button type="submit">Add resident</Button>
          </form>
        )}
      </Card>

      {/* Occupancy history */}
      {canSeeHistory && (
        <Card>
          <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">
            Past occupants
          </h2>
          {history && history.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {history.map((entry) => (
                <li key={entry.id} className="text-slate-600 dark:text-slate-400">
                  {entry.full_name} ({entry.relationship}) — {entry.start_date ?? "?"} to{" "}
                  {entry.end_date}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No past occupants recorded.</p>
          )}
        </Card>
      )}
    </div>
  );
}
