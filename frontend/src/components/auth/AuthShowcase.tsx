import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { getCategories, type Category } from "@/api/categories"
import { getSkills, type SkillList } from "@/api/skills"

export function AuthShowcase({ className }: { className?: string }) {
    const [categories, setCategories] = useState<Category[]>([])
    const [skills, setSkills] = useState<SkillList | null>(null)

    useEffect(() => {
        getCategories().then(setCategories).catch(() => {})
        getSkills({ limit: 2 }).then(setSkills).catch(() => {})
    }, [])

    const categoryName = (id: number) => categories.find((c) => c.id === id)?.name

    return (
        <section 
        style={{ viewTransitionName: "auth-showcase" }}
        className={cn("flex flex-col gap-6 bg-secondary p-6 md:p-10", className)}>
            <h2 className="text-4xl leading-tight font-bold md:text-5xl">
            {skills ? skills.total.toLocaleString() : "Thousands of"} prompts,
            <br />
            shared by people like you
            </h2>

            <div className="flex flex-wrap gap-2">
            {categories.slice(0, 3).map((c) => (
                <span key={c.id} className="rounded-full border bg-background px-4 py-1 text-sm font-bold">
                {c.name}
                </span>
            ))}
            {categories.length > 3 && (
                <span className="rounded-full border bg-background px-4 py-1 text-sm font-bold">
                + {categories.length - 3} more
                </span>
            )}
            </div>

            <div className="flex flex-col gap-4">
                {skills?.data.map((s) => (
                    <div key={s.id} className="rounded-3xl border bg-card p-4">
                        <p className="font-bold">“{s.title}”</p>
                        <p className="text-sm text-muted-foreground">{categoryName(s.category_id)}</p>
                    </div>
                )
            )}
            </div>
        </section>
    )
}