import { notFound } from "next/navigation"
import { EditSkill } from "@/components/skills/EditSkill"
import { parseSkillId } from "@/lib/parseSkillId"

export default async function EditSkillPage({
  params,
}: PageProps<"/skills/[skillId]/edit">) {
  const { skillId } = await params
  const id = parseSkillId(skillId)

  if (id === null) notFound()

  // key remounts the editor so one skill's values never carry into another's
  return <EditSkill key={id} skillId={id} />
}
