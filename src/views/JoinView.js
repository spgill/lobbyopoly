// Vendor imports
import { Button, TextInput } from "grommet";
import * as hookstate from "@hookstate/core";
import React from "react";
import styled from "styled-components";

// Local imports
import BulletedInstruction from "../components/BulletedInstruction";
import VerticalSpacer from "../components/VerticalSpacer";
import * as global from "../config/state";
import * as api from "../util/api";
import * as enumutil from "../util/enum";

const ErrorText = styled.p`
  color: ${props => props.theme.global.colors["status-error"]};
`;

const LobbyJoinMode = enumutil.createEnum({
  NONE: enumutil.auto(),
  JOIN: enumutil.auto(),
  CREATE: enumutil.auto(),
});

export default function JoinView(props) {
  // Global state vars
  const pageLoading = hookstate.useStateLink(global.pageLoadingLink);
  const preflightData = hookstate.useStateLink(global.preflightDataLink);
  const playerId = hookstate.useStateLink(global.playerIdLink);

  // Local state vars
  const [joinMode, setJoinMode] = React.useState(LobbyJoinMode.NONE);
  const [joinCode, setJoinCode] = React.useState("");
  const [joinName, setJoinName] = React.useState("");
  const [joinError, setJoinError] = React.useState(undefined);

  // Join form event handlers
  const handleChangeJoinCode = ev => setJoinCode(ev.target.value);
  const handleChangeJoinName = ev => setJoinName(ev.target.value);
  const handleClickJoinLobby = async () => {
    // Clear errors and set page loading
    setJoinError(undefined);
    pageLoading.set(true);

    // Hit the API to join/create lobby
    const resp = await api.makeRequest("post", "/api/join", {
      code: joinMode === LobbyJoinMode.JOIN ? joinCode : undefined,
      name: joinName,
    });

    // If there's an error, surface it to the user
    if (resp.error) {
      const errorText = preflightData.get().bundleMap[resp.error] || resp.error;
      setJoinError(errorText);
    }

    // Else, store the user ID
    else {
      playerId.set(resp.payload);
    }

    pageLoading.set(false);
  };

  return (
    <>
      {/* Content switcher for joining vs creating */}
      <BulletedInstruction n="1">What do you want to do?</BulletedInstruction>

      <VerticalSpacer factor={1} />

      <Button
        label="Join a lobby"
        active={joinMode === LobbyJoinMode.JOIN}
        onClick={() => setJoinMode(LobbyJoinMode.JOIN)}
      />
      <VerticalSpacer factor={0.382} />
      <Button
        label="Create a new lobby"
        active={joinMode === LobbyJoinMode.CREATE}
        onClick={() => setJoinMode(LobbyJoinMode.CREATE)}
      />

      {joinMode !== LobbyJoinMode.NONE && (
        <>
          <VerticalSpacer factor={1} />
          <hr style={{ margin: "0" }} />
          <VerticalSpacer factor={1} />
        </>
      )}

      {joinMode === LobbyJoinMode.JOIN && (
        <>
          <BulletedInstruction n="2">
            To join a lobby, just enter the lobby code below, enter your name,
            and press the button.
          </BulletedInstruction>
          <VerticalSpacer factor={1} />
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
            primary={true}
            label="Join Lobby"
            onClick={handleClickJoinLobby}
            disabled={!(joinCode && joinName)}
          />
        </>
      )}

      {joinMode === LobbyJoinMode.CREATE && (
        <>
          <BulletedInstruction n="2">
            To create a lobby, just enter your name below and press the button.
          </BulletedInstruction>
          <VerticalSpacer factor={1} />
          <TextInput
            placeholder="Your name"
            value={joinName}
            onChange={handleChangeJoinName}
          />
          <VerticalSpacer />
          <Button
            primary={true}
            label="Create Lobby"
            onClick={handleClickJoinLobby}
            disabled={!joinName}
          />
        </>
      )}

      {joinError && <ErrorText>{joinError}</ErrorText>}
    </>
  );
}
