// Vendor imports
import axios from "axios";
import { Grommet, Button } from "grommet";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";

// Local imports
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
  width: 100vw;
  max-width: 512px;
  padding: 1rem 0.5rem;
`;

export default function App(props) {
  // State flags
  const [isPageLoading, setPageLoading] = React.useState(true);
  const [isPreflightLoaded, setPreflightLoaded] = React.useState(false);

  // State vars
  const [playerId, setPlayerId] = React.useState(undefined);

  // On component mount, begin fetch of preflight data
  React.useEffect(() => {
    (async function() {
      const resp = await api.makeRequest("get", "/api/preflight");

      if (resp) {
        setPlayerId(resp);
      }

      setPreflightLoaded(true);
      setPageLoading(false);
    })();
  }, []);

  return (
    <ModifiedGrommetBase theme={appTheme}>
      <GlobalStyle />

      {/* <AppLayout> */}
      <ToolbarContainer>
        <ToolbarTitle>Lobbyopoly</ToolbarTitle>
      </ToolbarContainer>

      <ContentContainer>
        <code>{JSON.stringify(preflightData)}</code>
      </ContentContainer>

      {/* </Box> */}
      {/* </AppLayout> */}
    </ModifiedGrommetBase>
  );
}
