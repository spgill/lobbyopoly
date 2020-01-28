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
const POLLING_INTERVAL = 1500;
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
  const pageLoading = hookstate.useStateLink(global.pageLoadingLink);
  const preflightData = hookstate.useStateLink(global.preflightDataLink);
  const playerId = hookstate.useStateLink(global.playerIdLink);
  const lobbyData = hookstate.useStateLink(global.lobbyDataLink);
  const lobbyEvents = hookstate.useStateLink(global.lobbyEventsLink);

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
        preflightData.set(resp.payload);
        playerId.set(resp.payload.playerId);
      }

      // If there was an error, stop the preloader
      else {
        pageLoading.set(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main API polling function
  const pollLobbyData = React.useCallback(async () => {
    // Only poll if there is a player ID, else clear the data
    if (playerId.get()) {
      const pollData = await api.makeRequest("get", "/api/poll");

      // If there is an error, that likely means that the lobby is gone
      // or that the player has been kicked. So go back to the home page.
      if (pollData.error) {
        lobbyData.set(undefined);
        playerId.set(undefined);
      }

      // If there's no error, update the lobby data
      else {
        lobbyData.set(pollData.payload);
      }

      pageLoading.set(false);
    } else if (lobbyData.get()) {
      lobbyData.set(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId.get()]);

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

  // When the poll data changes, refresh the event log if needed
  React.useEffect(() => {
    (async () => {
      if (lobbyData.get() && lobbyData.get().eventHash !== eventHash.current) {
        const events = await api.makeRequest("get", "/api/events");

        lobbyEvents.set(events.payload);
        console.log("EVENTS", events.payload);

        // Update the ref'd event hash
        eventHash.current = lobbyData.get().eventHash;
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
      lobbyData.set(undefined);
      playerId.set(undefined);
    }
  };

  // When banker clicks disband button
  const handleClickDisband = async () => {
    // Fire off request to API endpoint to remove the user from the lobby
    const resp = await api.makeRequest("get", "/api/disband");

    // Now clear all the state var to reset back to the welcome form
    if (!resp.error) {
      lobbyData.set(undefined);
      playerId.set(undefined);
    }
  };

  return (
    <ModifiedGrommetBase theme={appTheme}>
      <GlobalStyle />

      <ToolbarContainer>
        <ToolbarTitle>Lobbyopoly</ToolbarTitle>
        {lobbyData.get() && (
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
                lobbyData.get() &&
                  lobbyData.get().banker !== playerId.get() && {
                    label: "Leave Lobby",
                    onClick: handleClickLeave,
                  },
                lobbyData.get() &&
                  lobbyData.get().banker === playerId.get() && {
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
        {pageLoading.get() && <Preloader />}

        {/* If preflight is loaded, but player is not in a lobby */}
        {preflightData.get() && !playerId.get() && <JoinView />}

        {/* If preflight is loaded AND player ID is determined AND lobby data is loaded */}
        {preflightData.get() && playerId.get() && lobbyData.get() && (
          <PlayView />
        )}

        {/* {JSON.stringify(lobbyData.get(), null, 1)} */}
      </MasterBox>

      {/* </Box> */}
      {/* </AppLayout> */}
    </ModifiedGrommetBase>
  );
}
