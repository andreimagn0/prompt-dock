import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

type Props = {
  message?: string
  onRetry?: () => void
}

export function ErrorState({
  message = "Something went wrong.",
  onRetry,
}: Props) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Error</AlertTitle>

      <AlertDescription>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1">{message}</p>

          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit shrink-0 self-start"
              onClick={onRetry}
            >
              Try again
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}