"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitContactMessage(formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("contact_messages").insert({
    name: formData.name,
    email: formData.email,
    subject: formData.subject || null,
    message: formData.message,
  });

  if (error) throw new Error(error.message);
}
