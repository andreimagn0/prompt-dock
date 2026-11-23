import type { Category } from "@/api/categories"
import type { Skill } from "@/api/skills"
import { SkillCard } from "./SkillCard"

type Props = {
  skills: Skill[]
  categories?: Category[]
}

export function SkillGrid({ skills, categories = [] }: Props) {
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]))

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((skill) => (
        <li key={skill.id}>
          <SkillCard
            skill={skill}
            categoryName={categoryNames.get(skill.category_id)}
          />
        </li>
      ))}
    </ul>
  )
}
