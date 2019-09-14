// Vendor imports
import axios from "axios";
import { Grommet, Box, Button, Tabs, Tab, TextInput } from "grommet";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";

// Local imports
import Preloader from "../components/Preloader";
import { ToolbarContainer, ToolbarTitle } from "../components/Toolbar";
import appTheme from "../config/theme";
import * as api from "../util/api";

const ModifiedGrommetBase = styled(Grommet)`
  display: grid;
  grid-template: 4rem 1fr / auto;

  width: 100vw;
  height: 100vh;
`;

const GlobalStyle = createGlobalStyle`
  html, body {
    margin: 0;
  }

  #root {
    width: 100vw;
    height: 100vh;
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
  max-width: 512px;
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

  // Lobby join state vars
  const [joinTab, setJoinTab] = React.useState(0);
  const [joinCode, setJoinCode] = React.useState("");
  const [joinName, setJoinName] = React.useState("");
  const [joinError, setJoinError] = React.useState(undefined);

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

  return (
    <ModifiedGrommetBase theme={appTheme}>
      <GlobalStyle />

      {/* <AppLayout> */}
      <ToolbarContainer>
        <ToolbarTitle>Lobbyopoly</ToolbarTitle>
      </ToolbarContainer>

      <MasterBox pad="large">
      {/* Show the dice preloader when the page is loading */}
      {isPageLoading && <Preloader />}

        {/* Tab switcher for joining vs creating */}
        <Tabs onActive={setJoinTab}>
          <Tab title="Join a lobby">
            <p>
              To join a lobby, just enter the lobby code below, enter your name,
              and press the button.
            </p>
            <TextInput
              placeholder="Lobby code"
              value={joinCode}
              onChange={handleChangeJoinCode}
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
      </MasterBox>

      {/* </Box> */}
      {/* </AppLayout> */}
    </ModifiedGrommetBase>
  );
}
