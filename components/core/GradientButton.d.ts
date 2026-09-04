import * as React from "react";
import type { ButtonProps } from "./Button";

/** The SkillFlow primary CTA — `Button` locked to the gradient variant. */
export interface GradientButtonProps extends Omit<ButtonProps, "variant"> {}
export function GradientButton(props: GradientButtonProps): React.JSX.Element;
