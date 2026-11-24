import { notFound } from "next/navigation"
import { SkillDetail } from "@/components/skills/SkillDetail"
import { parseSkillId } from "@/lib/parseSkillId"

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
