import { redirect } from "next/navigation";
import { requireProfile, isStaff } from "@/lib/auth";
import { createProperty } from "@/app/(app)/directory/actions";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { labelClass } from "@/components/ui/fieldStyles";
import { ESTATE_STREETS } from "@/lib/streets";

export default async function NewPropertyPage() {
  const profile = await requireProfile();
  if (!isStaff(profile.role)) redirect("/directory");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Add property</h1>
      <Card>
        <form action={createProperty} className="space-y-4">
          <div>
            <label className={labelClass} htmlFor="street_name">Street name</label>
            <Select id="street_name" name="street_name" required defaultValue="">
              <option value="" disabled>
                Select a street
              </option>
              {ESTATE_STREETS.map((street) => (
                <option key={street} value={street}>
                  {street}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className={labelClass} htmlFor="house_number">House/unit number</label>
            <Input id="house_number" name="house_number" required />
          </div>
          <div>
            <label className={labelClass} htmlFor="block">Block (optional)</label>
            <Input id="block" name="block" />
          </div>
          <div>
            <label className={labelClass} htmlFor="type">Type</label>
            <Select id="type" name="type" defaultValue="occupied">
              <option value="occupied">Occupied</option>
              <option value="rent">For rent</option>
              <option value="sale">For sale</option>
              <option value="both">Rent or sale</option>
            </Select>
          </div>
          <div>
            <label className={labelClass} htmlFor="status">Status</label>
            <Select id="status" name="status" defaultValue="available">
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="rented">Rented</option>
              <option value="sold">Sold</option>
            </Select>
          </div>
          <Button type="submit">Create property</Button>
        </form>
      </Card>
    </div>
  );
}
