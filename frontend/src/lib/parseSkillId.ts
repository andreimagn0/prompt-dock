// Accept only positive whole numbers; anything else can't be a skill ID
export function parseSkillId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}
