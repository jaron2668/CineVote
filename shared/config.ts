/**
 * Backend WebSocket server port
 * @type {number}
 */
export const backendPort: number = 3001;

/**
 * Backend server URL (WebSocket connection address)
 * @type {string}
 */
export const backendAdr: string = "http://localhost:" + backendPort;

/**
 * Duration of the "add movies" phase in milliseconds
 * After this time, the phase automatically transitions to voting.
 * @type {number}
 */
export const addPhaseTime: number = 180 * 1000; // in ms

/**
 * Duration of the "voting" phase in milliseconds
 * After this time, the phase automatically transitions to results.
 * @type {number}
 */
export const votePhaseTime: number = 180 * 1000; // in ms
