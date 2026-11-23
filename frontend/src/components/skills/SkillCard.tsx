import Link from "next/link"
import { StarIcon } from "lucide-react"
import type { Skill } from "@/api/skills"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Props = {
  skill: Skill
  categoryName?: string
}

// The title link stretches over the whole card (after:inset-0), so the card is
// clickable but keyboard and screen reader users get one short link: the title.
// Any future buttons on the card need `relative z-10` to sit above it.
export function SkillCard({ skill, categoryName }: Props) {
  return (
    <Card className="relative h-full transition-colors hover:bg-muted/50 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring/50">
      <CardHeader>
        <CardTitle>
          <h2>
            <Link
              href={`/skills/${skill.id}`}
              className="outline-none after:absolute after:inset-0"
            >
              {skill.title}
            </Link>
          </h2>
        </CardTitle>
        <CardDescription className="line-clamp-3">
          {skill.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex-row flex-wrap items-center gap-2">
        <Badge variant="secondary">
          {categoryName ?? `Category #${skill.category_id}`}
        </Badge>
        {skill.average_rating !== null && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <StarIcon className="size-4" aria-hidden="true" />
            <span>
              <span className="sr-only">Average rating: </span>
              {skill.average_rating.toFixed(1)}
              <span className="sr-only"> out of 5</span>
            </span>
          </span>
        )}
      </CardContent>
    </Card>
  )
}
