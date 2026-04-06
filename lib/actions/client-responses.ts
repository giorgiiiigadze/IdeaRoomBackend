"use server"

import { createClient } from "../server"
import { revalidatePath } from "next/cache"

export async function deleteTestimonial(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get("id") as string
  if (!id) return { error: "Missing testimonial ID" }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Unauthorized" }

  const { error } = await supabase
    .from("testimonials")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/client-responses")

  return { success: true }
}