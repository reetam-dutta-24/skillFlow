import type { Metadata } from "next";
import { googleAuthEnabled } from "@/lib/google-auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return <LoginForm google={googleAuthEnabled()} />;
}
