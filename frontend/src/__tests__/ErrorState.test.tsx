import { fireEvent, render, screen } from "@testing-library/react"
import { ErrorState } from "@/components/common/ErrorState"

describe("ErrorState", () => {
    it("shows the given message in an alert", () => {
        render(<ErrorState message="Could not load skills." />)

        expect(screen.getByRole("alert").textContent).toContain("Could not load skills.")
    })

    it("falls back to a generic message", () => {
        render(<ErrorState />)

        expect(screen.getByText("Something went wrong.")).toBeTruthy()
    })

    it("hides the retry button without onRetry", () => {
        render(<ErrorState message="Nope" />)

        expect(screen.queryByRole("button", { name: "Try again" })).toBeNull()
    })

    it("calls onRetry when the retry button is clicked", () => {
        const onRetry = jest.fn()
        render(<ErrorState message="Nope" onRetry={onRetry} />)

        fireEvent.click(screen.getByRole("button", { name: "Try again" }))

        expect(onRetry).toHaveBeenCalledTimes(1)
    })
})
