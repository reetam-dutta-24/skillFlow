// auth.ts
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import { googleAuthEnabled, normalizeEmail } from "@/lib/google-auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  session: { strategy: "jwt" },
  // Errors such as an unlinked Google account come back to the login page with ?error=.
  pages: { signIn: "/login", error: "/login" },
  providers: [
    // Without both keys the provider is left out, so no half-configured button can start a sign-in.
    ...(googleAuthEnabled()
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            // Always show the account chooser, so someone with two Google accounts picks the right one.
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        const email = normalizeEmail(credentials.email)
        if (!email) return null
        const user = await prisma.user.findUnique({ where: { email } })
        // A Google-only account has no password, so the password form cannot open it.
        if (!user || !user.password) return null

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        return valid ? user : null
      },
    }),
  ],
  callbacks: {
    // Google must say the address is verified. That is what makes it a real Gmail, not a typed-in one.
    // Linking is never done by email match alone: a signed-out Google sign-in whose email already has a
    // password account is refused (OAuthAccountNotLinked). The learner logs in with the password, then
    // connects Google from Settings, which proves they hold both.
    signIn: async ({ account, profile }) => {
      if (account?.provider === "google") {
        return profile?.email_verified === true && Boolean(profile.email)
      }
      return true
    },
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
      }
      return session
    },
  },
  events: {
    // Runs when a Google account is attached: on a first Google sign-in, and when a signed-in learner
    // connects Google from Settings.
    linkAccount: async ({ user, account, profile }) => {
      if (account.provider !== "google" || !user.id) return
      const googleEmail = normalizeEmail(profile.email)
      if (!googleEmail) return
      const current = await prisma.user.findUnique({
        where: { id: user.id },
        select: { email: true, emailVerified: true, image: true },
      })
      if (!current) return
      const data: { email?: string; emailVerified?: Date; image?: string } = {}
      if (current.email === googleEmail) {
        data.emailVerified = new Date()
      } else if (!current.emailVerified) {
        // The account was made with an address nobody verified. Move it to the verified Gmail,
        // unless another account already uses that address.
        const taken = await prisma.user.findUnique({ where: { email: googleEmail }, select: { id: true } })
        if (!taken) {
          data.email = googleEmail
          data.emailVerified = new Date()
        }
      }
      if (!current.image && typeof profile.image === "string") data.image = profile.image
      if (Object.keys(data).length > 0) {
        await prisma.user.update({ where: { id: user.id }, data })
      }
    },
  },
})
