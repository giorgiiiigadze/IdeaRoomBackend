// lib/actions/users.ts
"use server"

import { supabaseAdmin } from "../supabase/admin"

export async function getUsers() {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) return { error: error.message }
  return { users: data.users }
}

export async function createUser(email: string, password: string) {
  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) return { error: error.message }
  return { success: true }
}