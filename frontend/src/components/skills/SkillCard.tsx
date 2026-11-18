import type { Skill } from "@/api/skills"

export function SkillCard({ skill }: { skill: Skill }) {
    return (
        <div className="rounded-3xl border bg-card p-4" >
            <p className="font-bold">"{skill.title}"</p>
            <p className="text-sm text-muted-foreground">{skill.description}</p>
        </div>
    )
}