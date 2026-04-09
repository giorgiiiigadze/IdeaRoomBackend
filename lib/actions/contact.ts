"use server"

import { createClient } from "@/lib/supabase/server"

export async function updateContact(formData: FormData) {
  const supabase = await createClient()

  const phone_number = formData.get("phone_number") as string
  const academy_email = formData.get("academy_email") as string
  const academy_adress = formData.get("academy_adress") as string

  const { error } = await supabase
    .from("contact")
    .update({ phone_number, academy_email, academy_adress })
    .eq("id", 1)

  if (error) return { error: error.message }
  return { success: true }
}