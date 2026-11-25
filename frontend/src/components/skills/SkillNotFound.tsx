import { EmptyState } from "@/components/common/EmptyState"
import { BackToSkills } from "./BackToSkills"

// Shared by the route's not-found.tsx (malformed IDs) and SkillDetail (IDs the
// API reports as missing). The wording is the same for deleted, nonexistent and
// other people's private skills so the page never reveals which one it was.
export function SkillNotFound() {
  return (
    <section className="space-y-6" aria-labelledby="skill-heading">
      <BackToSkills />
      <h1 id="skill-heading" className="text-2xl font-semibold">
        Skill not found
      </h1>
      <EmptyState message="This skill doesn't exist or isn't available." />
    </section>
  )
}
