import * as React from "react";

/** Carousel page indicator — 8px dots, active dot widens to 20px. */
export interface PaginationDotsProps extends React.HTMLAttributes<HTMLDivElement> {
  total?: number;
  current?: number;
  onChange?: (page: number) => void;
}
export function PaginationDots(props: PaginationDotsProps): React.JSX.Element;
