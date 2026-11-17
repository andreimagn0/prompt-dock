type Props = { message?: string }

export function EmptyState({ message = "Nothing here yet." }: Props) {
  return <p className="py-12 text-center text-muted-foreground">{message}</p>
}