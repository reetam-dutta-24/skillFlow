"use client";

import { useState } from "react";
import { Button } from "@/components/core/Button.jsx";

/** Preview only. The choice stays on this screen until reload and is not saved. */
export function AddSkillButton() {
  const [added, setAdded] = useState(false);
  return (
    <Button type="button" variant={added ? "quiet" : "outline"} size="sm" disabled={added} onClick={() => setAdded(true)}>
      {added ? "Added" : "Add"}
    </Button>
  );
}
