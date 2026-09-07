"use client";

import React from "react";
import { SelectCard } from "../forms/SelectCard.jsx";
import { skills, comingSoonSkills } from "@/lib/mock-data";

const SKILL_ICONS: Record<string, string> = {
  "full-stack-web-dev": "code-2",
  "art-painting": "palette",
  "content-creation": "video",
};

export interface SkillSelectGridProps {
  selected: string[];
  onToggle: (slug: string) => void;
}

// Controlled so the parent (onboarding wizard or Settings) owns the
// selection — onboarding needs it lifted up since Step 2 depends on it,
// and Settings already owns its own "active niches" state.
export function SkillSelectGrid({ selected, onToggle }: SkillSelectGridProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
      {skills.map((skill) => (
        <SelectCard
          key={skill.slug}
          label={skill.name}
          description={skill.description}
          icon={SKILL_ICONS[skill.slug]}
          selected={selected.includes(skill.slug)}
          onSelect={() => onToggle(skill.slug)}
        />
      ))}
      {comingSoonSkills.map((skill) => (
        <SelectCard key={skill.label} label={skill.label} description={skill.description} icon={skill.icon} disabled />
      ))}
    </div>
  );
}
