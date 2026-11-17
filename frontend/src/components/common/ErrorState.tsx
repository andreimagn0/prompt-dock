import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

type Props = { message?: string; onRetry?: () => void }

export function ErrorState({ message = "Something went wrong.", onRetry }: Props) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {message}
        {onRetry && <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>Try again</Button>}
      </AlertDescription>
    </Alert>
  )
}