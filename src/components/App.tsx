// Vendor imports
import { Grommet, Box, Menu, ThemeContext } from 'grommet';
import React, { useContext } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

// Local imports
import Preloader from './Preloader';
import { ToolbarContainer, ToolbarRail, ToolbarTitle } from './Toolbar';
import {
  GlobalActionDispatchContext,
  GlobalStateAction,
  GlobalStateContext,
  defaultGlobalState,
  globalActionReducer,
} from '../utils/state';
import appTheme from '../config/theme';
import vars from '../config/vars';
import useRulesLayer from '../layers/RulesLayer';
import * as api from '../api/APIUtils';
import JoinView from '../views/JoinView';
import PlayView from '../views/PlayView';

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
  width: 100vw;
  max-width: 512px;
`;

export default function App() {
  const globalState = useContext(GlobalStateContext);
  const globalDispatch = useContext(GlobalActionDispatchContext);

  // Refs
  // const pollingInterval = React.useRef<number | undefined>(undefined);
  // const eventHash = React.useRef(null);

  // Main API polling function
  // const pollLobbyData = React.useCallback(async () => {
  //   // Only poll if there is a player ID, else clear the data
  //   if (globalState.playerId) {
  //     const pollData = await api.makeRequest('get', '/api/poll');

  //     // If there is an error, that likely means that the lobby is gone
  //     // or that the player has been kicked. So go back to the home page.
  //     if (pollData.error) {
  //       globalDispatch({ type: global.GlobalStateAction.RESET });
  //     }

  //     // If there's no error, update the lobby data
  //     else {
  //       globalDispatch({
  //         type: global.GlobalStateAction.POLL_SET,
  //         payload: pollData.payload,
  //       });
  //     }
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [globalState.playerId]);

  // Effect to start polling interval
  // TODO: switch to proper hook
  // React.useEffect(() => {
  //   if (globalState.playerId) {
  //     console.warn("Starting interval...");
  //     pollingInterval.current = window.setInterval(
  //       pollLobbyData,
  //       vars.POLLING_INTERVAL,
  //     );

  //     return () => {
  //       console.warn("Stopping interval...");
  //       clearInterval(pollingInterval.current);
  //     };
  //   }

  //   return undefined;
  // }, [globalState.playerId, pollLobbyData]);

  // Effect to immediately trigger a new poll when the playerId changes
  // React.useEffect(() => {
  //   if (globalState.playerId && !globalState.poll) {
  //     pollLobbyData();
  //   }
  // }, [globalState.playerId, globalState.poll, pollLobbyData]);

  // // When the poll data changes, refresh the event log if needed
  // React.useEffect(() => {
  //   (async () => {
  //     if (
  //       globalState.poll &&
  //       globalState.poll.eventHash !== eventHash.current
  //     ) {
  //       const events = await api.makeRequest('get', '/api/events');

  //       globalDispatch({
  //         type: global.GlobalStateAction.EVENTS_SET,
  //         payload: events.payload,
  //       });

  //       // Update the ref'd event hash
  //       eventHash.current = globalState.poll.eventHash;
  //     }
  //   })();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [globalState.poll]);

  // When user clicks log out button
  const handleClickLeave = async () => {
    // Fire off request to API endpoint to remove the user from the lobby
    const resp = await api.makeRequest('get', '/api/leave');

    // Now clear all the state var to reset back to the welcome form
    if (!resp.error) {
      globalDispatch({ type: GlobalStateAction.RESET_STATE });
    }
  };

  // When banker clicks disband button
  const handleClickDisband = async () => {
    // Fire off request to API endpoint to remove the user from the lobby
    const resp = await api.makeRequest('get', '/api/disband');

    // Now clear all the state var to reset back to the welcome form
    if (!resp.error) {
      globalDispatch({ type: GlobalStateAction.RESET_STATE });
    }
  };

  // Call hook for rules layer
  const [showRules, rulesComponent] = useRulesLayer();

  return (
    <ModifiedGrommetBase theme={appTheme}>
      <>
        <GlobalStyle />

        {rulesComponent}

        <ToolbarContainer>
          <ToolbarRail>
            <ToolbarTitle>Lobbyopoly</ToolbarTitle>

            <ThemeContext.Extend
              value={{
                global: {
                  colors: {
                    control: {
                      light: 'white',
                    },
                  },
                },
                menu: {
                  background: 'bgDark',
                },
              }}
            >
              <Menu
                style={{ marginLeft: 'auto' }}
                label="Actions"
                items={
                  [
                    { label: 'Game rules', onClick: showRules },
                    globalState.lobby &&
                      globalState.lobby.banker.$oid !==
                        globalState.playerId && {
                        label: 'Leave Lobby',
                        onClick: handleClickLeave,
                      },
                    globalState.lobby &&
                      globalState.lobby.banker.$oid ===
                        globalState.playerId && {
                        label: 'Disband Lobby',
                        onClick: handleClickDisband,
                      },
                  ].filter(Boolean) as any
                }
              />
            </ThemeContext.Extend>
          </ToolbarRail>
        </ToolbarContainer>

        <MasterBox pad="medium">
          {/* Show the dice preloader when the page is loading */}
          {globalState.applicationLoading && <Preloader />}

          {/* If preflight is loaded, but player is not in a lobby */}
          {globalState.preflight && !globalState.playerId && <JoinView />}

          {/* If preflight is loaded AND player ID is determined AND lobby data is loaded */}
          {globalState.preflight &&
            globalState.playerId &&
            globalState.lobby && <PlayView />}

          {/* {JSON.stringify(lobbyData, null, 1)} */}
        </MasterBox>

        {/* </Box> */}
        {/* </AppLayout> */}
      </>
    </ModifiedGrommetBase>
  );
}
