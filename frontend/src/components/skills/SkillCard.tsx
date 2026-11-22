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

// TODO(FE #9): link the card to the skill detail page once that route exists
export function SkillCard({ skill, categoryName }: Props) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <h2>{skill.title}</h2>
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
