/**
 * Generate a random room code for creating new rooms
 *
 * Generates a 4-character alphanumeric code in uppercase.
 * Uses Math.random() for simplicity.
 *
 * @returns {string} A 4-character uppercase alphanumeric code
 * ```
 */
export function generateRandomCode(): string {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}
