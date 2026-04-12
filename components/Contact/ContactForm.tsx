"use client"

import { useRef, useTransition } from "react"
import { updateContact } from "@/lib/actions/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface Props {
  defaultValues?: {
    phone_number: string
    academy_email: string
    academy_adress: string
  }
  onSuccess?: () => void
}

export default function ContactForm({ defaultValues, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updateContact(formData)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success("Contact info updated.")
        onSuccess?.()
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          name="phone_number"
          placeholder="+995 555 00 00 00"
          defaultValue={defaultValues?.phone_number}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="academy_email">Email</Label>
        <Input
          id="academy_email"
          name="academy_email"
          type="email"
          placeholder="example@gmail.com"
          defaultValue={defaultValues?.academy_email}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="academy_adress">Address</Label>
        <Input
          id="academy_adress"
          name="academy_adress"
          placeholder="City, Street #00"
          defaultValue={defaultValues?.academy_adress}
          required
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}