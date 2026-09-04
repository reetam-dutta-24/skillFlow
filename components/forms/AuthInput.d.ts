import * as React from "react";

/** Auth screen text field — 44px, 10px radius, leading Lucide icon. */
export interface AuthInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Lucide icon name shown at the leading edge. */
  icon?: string;
  type?: "text" | "email" | "password";
}
export function AuthInput(props: AuthInputProps): React.JSX.Element;
