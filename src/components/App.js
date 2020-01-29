// Vendor imports
import { Grommet, Box, Menu, ThemeContext } from "grommet";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";

// Local imports
import Preloader from "../components/Preloader";
import { ToolbarContainer, ToolbarTitle } from "../components/Toolbar";
import * as global from "../config/state";
import appTheme from "../config/theme";
import vars from "../config/vars";
import * as api from "../util/api";
import JoinView from "../views/JoinView";
import PlayView from "../views/PlayView";

const ModifiedGrommetBase = styled(Grommet)`
  display: grid;
  grid-template: 4rem 1fr / auto;

  width: 100%;
  min-height: 100%;
`;

const GlobalStyle = createGlobalStyle`
  html, body {
    margin: 0;
  }

  #root {
    width: 100%;
    min-height: 100%;
  }
`;

const MasterBox = styled(Box)`
  position: relative;

  overflow-x: hidden;
  overflow-y: auto;

  margin-right: auto;
  margin-left: auto;
  /* width: calc(100vw - 1rem); */
  width: 512px;
`;

export default function App(props) {
  // Global state reducer
  const [globalState, globalDispatch] = React.useReducer(
    global.globalStateReducer,
    global.initialState,
  );

  // Memoize the reducer to keep it from triggering every update
  const memoizedGlobalState = React.useMemo(
    () => [globalState, globalDispatch],
    [globalState, globalDispatch],
  );

  // Refs
  const pollingInterval = React.useRef(null);
  const eventHash = React.useRef(null);

  // On component mount, begin fetch of preflight data
  React.useEffect(() => {
    (async function() {
      const resp = await api.makeRequest("get", "/api/preflight");

      console.log("Preflight data:", resp);

      // If there is no error, set the data and player id and leave
      // the preloader going.
      if (!resp.error) {
        globalDispatch({
          type: global.GlobalStateAction.PREFLIGHT_SET,
          payload: resp.payload,
        });

        if (!resp.payload.playerId) {
          globalDispatch({
            type: global.GlobalStateAction.PAGE_LOADING_STOP,
          });
        }
      }

      // If there was an error, stop the preloader
      else {
        globalDispatch({
          type: global.GlobalStateAction.PAGE_LOADING_STOP,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main API polling function
  const pollLobbyData = React.useCallback(async () => {
    // Only poll if there is a player ID, else clear the data
    if (globalState.playerId) {
      const pollData = await api.makeRequest("get", "/api/poll");

      // If there is an error, that likely means that the lobby is gone
      // or that the player has been kicked. So go back to the home page.
      if (pollData.error) {
        globalDispatch({ type: global.GlobalStateAction.RESET });
      }

      // If there's no error, update the lobby data
      else {
        console.log("LATEST POLL", pollData.payload);
        globalDispatch({
          type: global.GlobalStateAction.POLL_SET,
          payload: pollData.payload,
        });
      }

      globalDispatch({ type: global.GlobalStateAction.PAGE_LOADING_STOP });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalState.playerId]);

  // Effect to start polling interval
  React.useEffect(() => {
    console.warn("Starting interval...");
    pollingInterval.current = window.setInterval(
      pollLobbyData,
      vars.POLLING_INTERVAL,
    );

    return () => {
      console.warn("Stopping interval...");
      clearInterval(pollingInterval.current);
    };
  }, [pollLobbyData]);

  // Effect to immediately trigger a new poll when the playerId changes
  React.useEffect(() => {
    if (globalState.playerId && !globalState.poll) {
      pollLobbyData();
    }
  }, [globalState.playerId, globalState.poll, pollLobbyData]);

  // When the poll data changes, refresh the event log if needed
  React.useEffect(() => {
    (async () => {
      if (
        globalState.poll &&
        globalState.poll.eventHash !== eventHash.current
      ) {
        const events = await api.makeRequest("get", "/api/events");

        globalDispatch({
          type: global.GlobalStateAction.EVENTS_SET,
          payload: events.payload,
        });
        console.log("EVENTS", events.payload);

        // Update the ref'd event hash
        eventHash.current = globalState.poll.eventHash;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalState.poll]);

  // When user clicks log out button
  const handleClickLeave = async () => {
    // Fire off request to API endpoint to remove the user from the lobby
    const resp = await api.makeRequest("get", "/api/leave");

    // Now clear all the state var to reset back to the welcome form
    if (!resp.error) {
      globalDispatch({ type: global.GlobalStateAction.RESET });
    }
  };

  // When banker clicks disband button
  const handleClickDisband = async () => {
    // Fire off request to API endpoint to remove the user from the lobby
    const resp = await api.makeRequest("get", "/api/disband");

    // Now clear all the state var to reset back to the welcome form
    if (!resp.error) {
      globalDispatch({ type: global.GlobalStateAction.RESET });
    }
  };

  return (
    <ModifiedGrommetBase theme={appTheme}>
      <GlobalStyle />

      <global.GlobalStateContext.Provider value={memoizedGlobalState}>
        <ToolbarContainer>
          <ToolbarTitle>Lobbyopoly</ToolbarTitle>
          {globalState.poll && (
            <ThemeContext.Extend
              value={{
                global: {
                  colors: {
                    control: {
                      light: "white",
                    },
                  },
                },
                menu: {
                  background: "bgDark",
                },
              }}>
              <Menu
                style={{ marginLeft: "auto" }}
                label="Actions"
                items={[
                  { label: "Rules", onClick: () => {} },
                  globalState.poll &&
                    globalState.poll.banker !== globalState.playerId && {
                      label: "Leave Lobby",
                      onClick: handleClickLeave,
                    },
                  globalState.poll &&
                    globalState.poll.banker === globalState.playerId && {
                      label: "Disband Lobby",
                      onClick: handleClickDisband,
                    },
                ].filter(Boolean)}
              />
            </ThemeContext.Extend>
          )}
        </ToolbarContainer>

        <MasterBox pad="medium">
          {/* Show the dice preloader when the page is loading */}
          {globalState.pageLoading && <Preloader />}

          {/* If preflight is loaded, but player is not in a lobby */}
          {globalState.preflight && !globalState.playerId && <JoinView />}

          {/* If preflight is loaded AND player ID is determined AND lobby data is loaded */}
          {globalState.preflight &&
            globalState.playerId &&
            globalState.poll && <PlayView />}

          {/* {JSON.stringify(lobbyData, null, 1)} */}
        </MasterBox>

        {/* </Box> */}
        {/* </AppLayout> */}
      </global.GlobalStateContext.Provider>
    </ModifiedGrommetBase>
  );
}
