import { createClient } from "@/lib/supabase/server";
import { requireProfile, isStaff } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { labelClass } from "@/components/ui/fieldStyles";
import { createExecutive, updateExecutive, deleteExecutive } from "./actions";

export default async function ExecutivesPage() {
  const profile = await requireProfile();
  const canEdit = isStaff(profile.role);
  const supabase = await createClient();

  const { data: executives } = await supabase
    .from("executives")
    .select("*")
    .order("is_active", { ascending: false })
    .order("display_order");

  const current = executives?.filter((e) => e.is_active) ?? [];
  const past = executives?.filter((e) => !e.is_active) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Executive Committee Records
      </h1>

      <Card>
        <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">
          Current committee
        </h2>
        <ExecutiveList executives={current} canEdit={canEdit} />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-medium text-slate-900 dark:text-slate-100">
          Past executives
        </h2>
        <ExecutiveList executives={past} canEdit={canEdit} />
      </Card>

      {canEdit && (
        <Card>
          <form action={createExecutive} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 sm:col-span-2">
              Add executive
            </p>
            <div>
              <label className={labelClass}>Full name</label>
              <Input name="full_name" required />
            </div>
            <div>
              <label className={labelClass}>Position</label>
              <Input name="position" placeholder="Chairman, Secretary, Treasurer..." required />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <Input name="phone" />
            </div>
            <div>
              <label className={labelClass}>Photo URL</label>
              <Input name="photo_url" />
            </div>
            <div>
              <label className={labelClass}>Tenure start</label>
              <Input name="tenure_start" type="date" required />
            </div>
            <div>
              <label className={labelClass}>Tenure end (blank if current)</label>
              <Input name="tenure_end" type="date" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Handover document URL</label>
              <Input name="handover_document_url" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="new-active" name="is_active" defaultChecked />
              <label htmlFor="new-active" className="text-sm text-slate-700 dark:text-slate-300">
                Currently active
              </label>
            </div>
            <div>
              <label className={labelClass}>Display order</label>
              <Input name="display_order" type="number" defaultValue={0} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Add executive</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

type Executive = {
  id: string;
  full_name: string;
  position: string;
  phone: string | null;
  photo_url: string | null;
  tenure_start: string;
  tenure_end: string | null;
  handover_document_url: string | null;
  is_active: boolean;
  display_order: number;
};

function ExecutiveList({ executives, canEdit }: { executives: Executive[]; canEdit: boolean }) {
  if (executives.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">None recorded.</p>;
  }

  return (
    <div className="space-y-3">
      {executives.map((executive) =>
        canEdit ? (
          <form
            key={executive.id}
            action={updateExecutive.bind(null, executive.id)}
            className="grid grid-cols-1 gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-2"
          >
            <Input name="full_name" defaultValue={executive.full_name} required />
            <Input name="position" defaultValue={executive.position} required />
            <Input name="phone" defaultValue={executive.phone ?? ""} placeholder="Phone" />
            <Input name="photo_url" defaultValue={executive.photo_url ?? ""} placeholder="Photo URL" />
            <Input name="tenure_start" type="date" defaultValue={executive.tenure_start} required />
            <Input name="tenure_end" type="date" defaultValue={executive.tenure_end ?? ""} />
            <Input
              name="handover_document_url"
              defaultValue={executive.handover_document_url ?? ""}
              placeholder="Handover document URL"
              className="sm:col-span-2"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`active-${executive.id}`}
                name="is_active"
                defaultChecked={executive.is_active}
              />
              <label htmlFor={`active-${executive.id}`} className="text-sm text-slate-700 dark:text-slate-300">
                Currently active
              </label>
            </div>
            <Input name="display_order" type="number" defaultValue={executive.display_order} />
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">Save</Button>
              <Button type="submit" variant="danger" formAction={deleteExecutive.bind(null, executive.id)}>
                Delete
              </Button>
            </div>
          </form>
        ) : (
          <div key={executive.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3 dark:border-slate-800">
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">{executive.full_name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {executive.position} · {executive.tenure_start} – {executive.tenure_end ?? "present"}
              </p>
            </div>
            <Badge tone={executive.is_active ? "green" : "slate"}>
              {executive.is_active ? "Active" : "Past"}
            </Badge>
          </div>
        )
      )}
    </div>
  );
}
