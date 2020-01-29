// vendor imports
import React from "react";

// local imports
import * as enumutil from "../util/enum";

// Initial global state for the application
export const initialState = {
  pageLoading: true,
  playerId: null,
  preflight: null,
  poll: null,
  currentPlayer: {},
  events: [],
};

// Context for passing down the application state
export const GlobalStateContext = React.createContext(initialState);

// Enum representing the possible action types on the global state
export const GlobalStateAction = enumutil.createEnum({
  RESET: enumutil.auto(),
  PAGE_LOADING_START: enumutil.auto(),
  PAGE_LOADING_STOP: enumutil.auto(),
  PLAYER_ID_SET: enumutil.auto(),
  PREFLIGHT_SET: enumutil.auto(),
  POLL_SET: enumutil.auto(),
  EVENTS_SET: enumutil.auto(),
});

// Reducer for handling actions on the global state
export function globalStateReducer(currentState, action) {
  switch (action.type) {
    case GlobalStateAction.RESET:
      return {
        ...currentState,
        playerId: initialState.playerId,
      };

    case GlobalStateAction.PAGE_LOADING_START:
      return { ...currentState, pageLoading: true };

    case GlobalStateAction.PAGE_LOADING_STOP:
      return { ...currentState, pageLoading: false };

    case GlobalStateAction.PLAYER_ID_SET:
      return { ...currentState, playerId: action.payload };

    case GlobalStateAction.PREFLIGHT_SET:
      return {
        ...currentState,
        playerId: action.payload.playerId,
        preflight: action.payload,
      };
    case GlobalStateAction.POLL_SET:
      return {
        ...currentState,
        poll: action.payload,
        currentPlayer:
          action.payload.players.filter(
            ply => ply._id === currentState.playerId,
          )[0] || {},
      };

    case GlobalStateAction.EVENTS_SET:
      return { ...currentState, events: action.payload };

    default:
      console.error(`UNKNOWN ACTION TYPE "${action.type}"`);
      return currentState;
  }
}
