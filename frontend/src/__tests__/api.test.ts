import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from "axios"
import api, { getErrorMessage, isNotFoundError } from "@/api/api"

function responseError(status: number, data: unknown) {
    const config = { headers: new AxiosHeaders() }
    const response = { status, statusText: "", data, headers: {}, config } as AxiosResponse
    return new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, null, response)
}

describe("getErrorMessage", () => {
    it("returns a string detail from the backend", () => {
        expect(getErrorMessage(responseError(400, { detail: "Username already taken" }))).toBe("Username already taken")
    })

    it("returns the first message of a validation error list", () => {
        const detail = [{ msg: "Email is not valid" }, { msg: "Password too short" }]
        expect(getErrorMessage(responseError(422, { detail }))).toBe("Email is not valid")
    })

    it("falls back when a validation error list has no message", () => {
        expect(getErrorMessage(responseError(422, { detail: [] }))).toBe("Invalid input.")
    })

    it("explains when the server cannot be reached", () => {
        expect(getErrorMessage(new AxiosError("Network Error", "ERR_NETWORK"))).toBe("Can't reach the server.")
    })

    it("uses a generic message for responses without a detail", () => {
        expect(getErrorMessage(responseError(500, "<html>Internal error</html>"))).toBe("Something went wrong.")
    })

    it("uses a generic message for non-axios errors", () => {
        expect(getErrorMessage(new Error("boom"))).toBe("Something went wrong.")
        expect(getErrorMessage("boom")).toBe("Something went wrong.")
    })
})

describe("isNotFoundError", () => {
    it("is true only for axios 404 responses", () => {
        expect(isNotFoundError(responseError(404, { detail: "Not found" }))).toBe(true)
        expect(isNotFoundError(responseError(500, { detail: "Oops" }))).toBe(false)
        expect(isNotFoundError(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(false)
        expect(isNotFoundError(new Error("Not found"))).toBe(false)
    })
})

describe("api request interceptor", () => {
    // Echo back the outgoing Authorization header instead of making a network call
    const echoAuth: AxiosAdapter = async (config) => ({
        data: config.headers.Authorization ?? null,
        status: 200, statusText: "OK", headers: {}, config,
    })

    it("refuses to send requests without an API base URL", async () => {
        await expect(api.get("/categories", { baseURL: "", adapter: echoAuth }))
            .rejects.toThrow("NEXT_PUBLIC_API_URL is not set")
    })

    it("sends the login cookie with every request", () => {
        expect(api.defaults.withCredentials).toBe(true)
    })

    it("does not attach an Authorization header", async () => {
        const res = await api.get("/categories", { baseURL: "http://api.test", adapter: echoAuth })

        expect(res.data).toBeNull()
    })
})
