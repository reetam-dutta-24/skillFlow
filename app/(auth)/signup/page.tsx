// app/signup/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signUp } from "./actions"

export default function SignUpPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    const result = await signUp(formData)
    if (result.error) {
      setError(result.error)
      return
    }
    router.push("/login?registered=true")
  }

  return (
    <div style={{ maxWidth: 360, margin: "4rem auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Sign up</h1>
      <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input name="name" placeholder="Name" required />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required minLength={8} />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Create account</button>
      </form>
    </div>
  )
}