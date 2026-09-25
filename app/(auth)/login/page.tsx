// app/login/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    const result = await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    })

    if (result?.error) {
      setError("Invalid email or password.")
      return
    }

    router.push("/dashboard")
  }

  return (
    <div style={{ maxWidth: 360, margin: "4rem auto", display: "flex", flexDirection: "column", gap: 12 }}>
      <h1>Log in</h1>
      <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Log in</button>
      </form>
    </div>
  )
}