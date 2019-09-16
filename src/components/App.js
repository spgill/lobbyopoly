// Vendor imports
import {
  Grommet,
  Box,
  Button,
  Menu,
  Tabs,
  Tab,
  TextInput,
  ThemeContext,
} from "grommet";
import polished from "polished";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";

// Local imports
import Preloader from "../components/Preloader";
import { ToolbarContainer, ToolbarTitle } from "../components/Toolbar";
import appTheme from "../config/theme";
import * as api from "../util/api";
import { useInterval } from "../util/interval";

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

const ContentContainer = styled.div`
  overflow-x: hidden;
  overflow-y: scroll;

  margin-right: auto;
  margin-left: auto;
  width: calc(100vw - 1rem);
  max-width: 512px;
  padding: 1rem 0.5rem;
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

const VerticalSpacer = styled.div`
  height: calc(
    ${props => props.theme.global.spacing} * ${props => props.factor || 1.0}
  );
`;

const ErrorText = styled.p`
  color: ${props => props.theme.global.colors["status-error"]};
`;

export default function App(props) {
  // App-wide state vars
  const [isPageLoading, setPageLoading] = React.useState(true);
  const [isPreflightLoaded, setPreflightLoaded] = React.useState(false);
  const [playerId, setPlayerId] = React.useState(undefined);
  const [lobbyData, setLobbyData] = React.useState(undefined);
  const [lobbyEvents, setLobbyEvents] = React.useState([]);

  // Lobby join state vars
  const [joinTab, setJoinTab] = React.useState(0);
  const [joinCode, setJoinCode] = React.useState("");
  const [joinName, setJoinName] = React.useState("");
  const [joinError, setJoinError] = React.useState(undefined);

  // Refs
  const eventHash = React.useRef(null);

  // On component mount, begin fetch of preflight data
  React.useEffect(() => {
    (async function() {
      const resp = await api.makeRequest("get", "/api/preflight");

      console.error("Preflight data:", resp);

      if (resp) {
        setPlayerId(resp);
      }

      setPreflightLoaded(true);
      setPageLoading(false);
    })();
  }, []);

  // Main API polling function
  useInterval(async () => {
    // Only poll if there is a player ID, else clear the data
    if (playerId) {
      const pollData = await api.makeRequest("get", "/api/poll");

      // If there's no error, update the lobby data
      if (!pollData.__error__) {
        setLobbyData(pollData);
      }
    } else if (lobbyData) {
      setLobbyData(undefined);
    }
  }, 1000);

  // When the poll data changes, refresh the event log if needed
  React.useEffect(() => {
    (async () => {
      if (lobbyData && lobbyData.eventHash !== eventHash.current) {
        const events = await api.makeRequest("get", "/api/events");

        setLobbyEvents(events);
        console.warn("EVENTS", events);

        // Update the ref'd event hash
        eventHash.current = lobbyData.eventHash;
      }
    })();
  }, [lobbyData]);

  // Join form event handlers
  const handleChangeJoinCode = ev => setJoinCode(ev.target.value);
  const handleChangeJoinName = ev => setJoinName(ev.target.value);
  const handleClickJoinLobby = async () => {
    // Clear errors and set page loading
    setJoinError(undefined);
    setPageLoading(true);

    // Hit the API to join/create lobby
    const resp = await api.makeRequest("post", "/api/join", {
      code: joinTab === 0 ? joinCode : undefined,
      name: joinName,
    });

    // If there's an error, surface it to the user
    if (resp.__error__) {
      setJoinError(resp.__error__);
    }

    // Else, store the user ID
    else {
      setPlayerId(resp);
    }

    setPageLoading(false);
  };

  // When use clicks log out button
  const handleClickLeave = async () => {
    // Fire off request to API endpoint to remove the user from the lobby
    await api.makeRequest("get", "/api/leave");

    // Now clear all the state var to reset back to the welcome form
    setLobbyData(undefined);
    setPlayerId(undefined);
  };

  const getPlayer = id => {
    for (const ply of lobbyData.players) {
      if (ply._id === id) {
        return ply;
      }
    }
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
            items={[{ label: "Leave Lobby", onClick: handleClickLeave }]}
          />
        </ThemeContext.Extend>
      </ToolbarContainer>

      <MasterBox pad="large">
        {/* Show the dice preloader when the page is loading */}
        {isPageLoading && <Preloader />}

        {/* If preflight is loaded, but player is not in a lobby */}
        {isPreflightLoaded && !playerId && (
          <>
            {/* Tab switcher for joining vs creating */}
            <Tabs onActive={setJoinTab}>
              <Tab title="Join a lobby">
                <p>
                  To join a lobby, just enter the lobby code below, enter your
                  name, and press the button.
                </p>
                <TextInput
                  placeholder="Lobby code"
                  value={joinCode}
                  onChange={handleChangeJoinCode}
                  type="tel"
                />
                <VerticalSpacer factor={0.382} />
                <TextInput
                  placeholder="Your name"
                  value={joinName}
                  onChange={handleChangeJoinName}
                />
                <VerticalSpacer />
                <Button
                  label="Join Lobby"
                  onClick={handleClickJoinLobby}
                  disabled={!(joinCode && joinName)}
                />
              </Tab>
              <Tab title="Create a lobby">
                <p>
                  To create a lobby, just enter your name below and press the
                  button.
                </p>
                <TextInput
                  placeholder="Your name"
                  value={joinName}
                  onChange={handleChangeJoinName}
                />
                <VerticalSpacer />
                <Button
                  label="Create Lobby"
                  onClick={handleClickJoinLobby}
                  disabled={!joinName}
                />
              </Tab>
            </Tabs>

            {joinError && <ErrorText>{joinError}</ErrorText>}
          </>
        )}

        {/* Show quick loading screen while waiting on first poll to complete */}
        {isPreflightLoaded && playerId && !lobbyData && (
          <p style={{ textAlign: "center" }}>Loading...</p>
        )}

        {/* If preflight is loaded AND player ID is determined AND lobby data is loaded */}
        {isPreflightLoaded && playerId && lobbyData && (
          <>
            <span>
              Lobby code: <code>{lobbyData.code}</code>
            </span>
            <Box>
              <h3>Bank</h3>
              <code>{lobbyData.bank}</code>
            </Box>
            <Box>
              <h3>Free Parking</h3>
              <code>{lobbyData.freeParking}</code>
            </Box>
            <Box>
              <h3>My funds</h3>
              <code>{getPlayer(playerId).balance}</code>
            </Box>
            <Box>
              <ul>
                {lobbyEvents.map(event => (
                  <li key={event._id}>
                    {event.text.replace(
                      /PLAYER<([a-z0-9]+)>/,
                      (match, group1) => {
                        const ply = getPlayer(group1);
                        return ply ? ply.name : "DISCONNECTED";
                      },
                    )}
                  </li>
                ))}
              </ul>
            </Box>
          </>
        )}

        {/* {JSON.stringify(lobbyData, null, 1)} */}
      </MasterBox>

      {/* </Box> */}
      {/* </AppLayout> */}
    </ModifiedGrommetBase>
  );
}
