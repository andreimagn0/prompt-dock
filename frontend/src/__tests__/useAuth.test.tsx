import { render } from "@testing-library/react"
import { useAuth } from "@/context/AuthContext"

function NeedsAuth() {
    useAuth()
    return null
}

describe("useAuth", () => {
    it("throws a clear error outside AuthProvider", () => {
        // React logs the thrown render error; keep the test output clean
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})

        expect(() => render(<NeedsAuth />)).toThrow("useAuth must be used within an AuthProvider")

        consoleError.mockRestore()
    })
})
