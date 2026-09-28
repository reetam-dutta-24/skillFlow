import type { Metadata } from "next";
import { SignUpForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Create an account",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
