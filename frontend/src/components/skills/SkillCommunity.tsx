
import { SkillComments } from "./SkillComments"

type Props = {
  skillId: number
}

// The community features that are still waiting to be implemented.
const FEATURES = [
  { id: "ratings", title: "Ratings", description: "Rate this skill from 1 to 5." },
  { id: "save", title: "Save", description: "Keep this skill in your saved list." },
  { id: "versions", title: "Versions", description: "Browse earlier versions of this skill." },
  { id: "forks", title: "Forks", description: "Make your own copy to build on." },
]

export function SkillCommunity({ skillId }: Props) {
  return (
    <section className="space-y-6" aria-labelledby="skill-community-heading">
      <h2 id="skill-community-heading" className="text-lg font-semibold">
        Community
      </h2>

      {/* Real comments feature */}
      <SkillComments skillId={skillId} />

      {/* Other community features that are not implemented yet */}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <li
            key={feature.id}
            data-community-slot={feature.id}
            className="space-y-1 rounded-xl border border-dashed p-4"
          >
            <h3 className="font-medium">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
