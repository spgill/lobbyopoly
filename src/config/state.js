// vendor imports
import * as hookstate from "@hookstate/core";

/** Is the application loading something? */
export const pageLoadingLink = hookstate.createStateLink(true);

/** Application preflight data */
export const preflightDataLink = hookstate.createStateLink(undefined);

/** The current player's id */
export const playerIdLink = hookstate.createStateLink(undefined);

/** The current lobby's data */
export const lobbyDataLink = hookstate.createStateLink(undefined);

/** Array of lobby's events */
export const lobbyEventsLink = hookstate.createStateLink([]);
