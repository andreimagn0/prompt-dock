import { notFound } from "next/navigation"
import { SkillDetail } from "@/components/skills/SkillDetail"

// Accept only positive whole numbers; anything else can't be a skill ID
function parseSkillId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

export default async function SkillDetailPage({
  params,
}: PageProps<"/skills/[skillId]">) {
  const { skillId } = await params
  const id = parseSkillId(skillId)

  if (id === null) notFound()

  // key remounts the client component so the previous skill never flashes
  // while the next one loads
  return <SkillDetail key={id} skillId={id} />
}
