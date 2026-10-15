"use client";

import { DetoxGauge } from "@/components/detox/DetoxGauge";
import { useCalmMotion } from "@/components/feedback/useCalmMotion";

/** The small dial on Home. It sweeps from last week's score; reduced motion shows the score straight away. */
export function HomeDetoxDial({ score, from }: { score: number; from: number }) {
  const reduce = useCalmMotion();
  return (
    <div className="sf-home-detox-dial">
      <DetoxGauge score={score} from={from} reduce={reduce} size="sm" />
    </div>
  );
}
