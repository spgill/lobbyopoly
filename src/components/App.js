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
import { useInterval } from "../util/interval";
import JoinView from "../views/JoinView";

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

function formatEventInsert(el) {
  return `<span style="color: #91721f;">${el}</span>`;
}

export default function App(props) {
  // Global state vars
  const pageLoading = hookstate.useStateLink(global.pageLoadingLink);
  const preflightData = hookstate.useStateLink(global.preflightDataLink);
  const playerId = hookstate.useStateLink(global.playerIdLink);
  const lobbyData = hookstate.useStateLink(global.lobbyDataLink);
  const lobbyEvents = hookstate.useStateLink(global.lobbyEventsLink);

  // Refs
  const eventHash = React.useRef(null);

  // On component mount, begin fetch of preflight data
  React.useEffect(() => {
    (async function() {
      const resp = await api.makeRequest("get", "/api/preflight");

      console.log("Preflight data:", resp);

      if (resp.payload) {
        preflightData.set(resp.payload);
        playerId.set(resp.payload.playerId);
      }
      pageLoading.set(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Main API polling function
  useInterval(async () => {
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
    } else if (lobbyData.get()) {
      lobbyData.set(undefined);
    }
  }, 1000);

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

  const getPlayer = id => {
    return lobbyData.get().players.filter(ply => ply._id === id)[0];
  };

  const formatEvent = event => {
    const eventText = preflightData.get().bundleMap[event.key];
    return eventText === undefined
      ? event.key
      : eventText.replace(/\{(\d+)\}/g, (match, group1) => {
          const idx = parseInt(group1, 10);
          const insert = event.inserts[idx];

          // Index MAY not exist if server code has changed
          if (insert !== undefined) {
            // Arrays are processed as special types
            if (Array.isArray(insert)) {
              const [insertKind, insertValue] = insert;

              switch (insertKind) {
                // Player inserts should lookup and return player name
                case "player":
                  const ply = getPlayer(insertValue);
                  return formatEventInsert(
                    ply ? ply.name : "<em>disconnected</em>",
                  );

                // Common inserts should look up the string from the bundle
                case "bundle":
                  return formatEventInsert(
                    preflightData.get().bundleMap[insertValue],
                  );

                // Else, just try and jsonify the value
                default:
                  return JSON.stringify(insertValue);
              }

              // If it's not an object, just try returning it (it's prolly a string)
            } else {
              return formatEventInsert(insert);
            }
          }
        });
  };

  return (
    <ModifiedGrommetBase theme={appTheme}>
      <GlobalStyle />

      <ToolbarContainer>
        <ToolbarTitle>Lobbyopoly</ToolbarTitle>
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
              { label: "Leave Lobby", onClick: handleClickLeave },
              lobbyData.get() &&
                lobbyData.get().banker === playerId.get() && {
                  label: "Disband Lobby",
                  onClick: handleClickDisband,
                },
            ].filter(Boolean)}
          />
        </ThemeContext.Extend>
      </ToolbarContainer>

      <MasterBox pad="large">
        {/* Show the dice preloader when the page is loading */}
        {pageLoading.get() && <Preloader />}

        {/* If preflight is loaded, but player is not in a lobby */}
        {preflightData.get() && !playerId.get() && <JoinView />}

        {/* Show quick loading screen while waiting on first poll to complete */}
        {preflightData.get() && playerId.get() && !lobbyData.get() && (
          <p style={{ textAlign: "center" }}>Loading...</p>
        )}

        {/* If preflight is loaded AND player ID is determined AND lobby data is loaded */}
        {preflightData.get() && playerId.get() && lobbyData.get() && (
          <>
            <span>
              Lobby code: <code>{lobbyData.get().code}</code>
            </span>
            <Box>
              <h3>Bank</h3>
              <code>{lobbyData.get().bank}</code>
            </Box>
            <Box>
              <h3>Free Parking</h3>
              <code>{lobbyData.get().freeParking}</code>
            </Box>
            <Box>
              <h3>My funds</h3>
              <code>{getPlayer(playerId.get()).balance}</code>
            </Box>
            <Box>
              <ul>
                {lobbyEvents.get().map(event => (
                  <li
                    key={event._id}
                    dangerouslySetInnerHTML={{
                      __html: formatEvent(event),
                    }}
                  />
                ))}
              </ul>
            </Box>
          </>
        )}

        {/* {JSON.stringify(lobbyData.get(), null, 1)} */}
      </MasterBox>

      {/* </Box> */}
      {/* </AppLayout> */}
    </ModifiedGrommetBase>
  );
}
