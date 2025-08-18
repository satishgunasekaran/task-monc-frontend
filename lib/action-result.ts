// Standardized action result types and helpers
export type ActionResult<T = void> =
    | { success: true; data?: T }
    | { success: false; error: string };

export function success<T>(data?: T): ActionResult<T> {
    return { success: true, data };
}

export function failure(message: string): ActionResult<never> {
    return { success: false, error: message };
}