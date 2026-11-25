// Shared test helpers. Not a test file itself (jest only runs *.test.ts[x]).

// Shaped like an axios error with a FastAPI `detail`, so getErrorMessage
// returns the backend message instead of the generic fallback.
export function apiError(detail: string, status = 400) {
    return Object.assign(new Error(detail), {
        isAxiosError: true,
        response: { status, data: { detail } },
    })
}

// A promise the test resolves by hand, for asserting in-flight UI states.
export function deferred<T>() {
    let resolve!: (value: T) => void
    let reject!: (reason: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}
