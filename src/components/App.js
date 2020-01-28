// Vendor imports
import { Grommet, Box, Menu, ThemeContext } from "grommet";
import * as hookstate from "@hookstate/core";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";

// Local imports
import Preloader from "../components/Preloader";
import { ToolbarContainer, ToolbarTitle } from "../components/Toolbar";
import * as global from "../config/state";
import appTheme from "../config/theme";
import * as api from "../util/api";
import JoinView from "../views/JoinView";
import PlayView from "../views/PlayView";

// #region Constants
const POLLING_INTERVAL = 1000 * 3; // 3 seconds
// #endregion

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
  // Global state vars
  const [isPageLoading, setPageLoading] = global.useDerefStateLink(
    global.pageLoadingLink,
  );
  const [preflightData, setPreflightData] = global.useDerefStateLink(
    global.preflightDataLink,
  );
  const [playerId, setPlayerId] = global.useDerefStateLink(global.playerIdLink);
  const [lobbyData, setLobbyData] = global.useDerefStateLink(
    global.lobbyDataLink,
  );
  const [, setLobbyEvents] = global.useDerefStateLink(global.lobbyEventsLink);

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
        setPreflightData(resp.payload);
        setPlayerId(resp.payload.playerId);
      }

      // If there was an error, stop the preloader
      else {
        setPageLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main API polling function
  const pollLobbyData = React.useCallback(async () => {
    // Only poll if there is a player ID, else clear the data
    if (playerId) {
      const pollData = await api.makeRequest("get", "/api/poll");

      // If there is an error, that likely means that the lobby is gone
      // or that the player has been kicked. So go back to the home page.
      if (pollData.error) {
        setLobbyData(undefined);
        setPlayerId(undefined);
      }

      // If there's no error, update the lobby data
      else {
        setLobbyData(pollData.payload);
      }

      setPageLoading(false);
    } else if (lobbyData) {
      setLobbyData(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  // Effect to start polling interval
  React.useEffect(() => {
    console.warn("Starting interval...");
    pollingInterval.current = window.setInterval(
      pollLobbyData,
      POLLING_INTERVAL,
    );

    return () => {
      console.warn("Stopping interval...");
      clearInterval(pollingInterval.current);
    };
  }, [pollLobbyData]);

  // Effect to immediately trigger a new poll when the playerId changes
  React.useEffect(() => {
    if (playerId && !lobbyData) {
      pollLobbyData();
    }
  }, [playerId, lobbyData, pollLobbyData]);

  // When the poll data changes, refresh the event log if needed
  React.useEffect(() => {
    (async () => {
      if (lobbyData && lobbyData.eventHash !== eventHash.current) {
        const events = await api.makeRequest("get", "/api/events");

        setLobbyEvents(events.payload);
        console.log("EVENTS", events.payload);

        // Update the ref'd event hash
        eventHash.current = lobbyData.eventHash;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lobbyData]);

  // When user clicks log out button
  const handleClickLeave = async () => {
    // Fire off request to API endpoint to remove the user from the lobby
    const resp = await api.makeRequest("get", "/api/leave");

    // Now clear all the state var to reset back to the welcome form
    if (!resp.error) {
      setLobbyData(undefined);
      setPlayerId(undefined);
    }
  };

  // When banker clicks disband button
  const handleClickDisband = async () => {
    // Fire off request to API endpoint to remove the user from the lobby
    const resp = await api.makeRequest("get", "/api/disband");

    // Now clear all the state var to reset back to the welcome form
    if (!resp.error) {
      setLobbyData(undefined);
      setPlayerId(undefined);
    }
  };

  return (
    <ModifiedGrommetBase theme={appTheme}>
      <GlobalStyle />

      <ToolbarContainer>
        <ToolbarTitle>Lobbyopoly</ToolbarTitle>
        {lobbyData && (
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
                lobbyData &&
                  lobbyData.banker !== playerId && {
                    label: "Leave Lobby",
                    onClick: handleClickLeave,
                  },
                lobbyData &&
                  lobbyData.banker === playerId && {
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
        {isPageLoading && <Preloader />}

        {/* If preflight is loaded, but player is not in a lobby */}
        {preflightData && !playerId && <JoinView />}

        {/* If preflight is loaded AND player ID is determined AND lobby data is loaded */}
        {preflightData && playerId && lobbyData && <PlayView />}

        {/* {JSON.stringify(lobbyData, null, 1)} */}
      </MasterBox>

      {/* </Box> */}
      {/* </AppLayout> */}
    </ModifiedGrommetBase>
  );
}
