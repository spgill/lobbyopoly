// Vendor imports
import { Button, CheckBox, FormField, Select, TextInput } from "grommet";
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

const AlignedCheckBoxContainer = styled.div`
  margin-left: calc(${props => props.theme.global.spacing} * 1.5);
`;

const AlignedFormField = styled(FormField)`
  margin: 0 0 0 calc(${props => props.theme.global.spacing} * 1.5);
`;

const LobbyJoinMode = enumutil.createEnum({
  NONE: enumutil.auto(),
  JOIN: enumutil.auto(),
  CREATE: enumutil.auto(),
});

export default function JoinView(props) {
  // Global state reducer
  const [globalState, globalDispatch] = React.useContext(
    global.GlobalStateContext,
  );

  // Local state vars
  const [joinMode, setJoinMode] = React.useState(LobbyJoinMode.NONE);
  const [joinCode, setJoinCode] = React.useState("");
  const [joinName, setJoinName] = React.useState("");
  const [joinError, setJoinError] = React.useState(undefined);
  const [gameOptions, setGameOptions] = React.useState({
    unlimitedBank: false,
    freeParking: true,
    maxPlayers: 8,
    bankBalance: 20580, // The original game came with $15140
    startingBalance: 1500,
    currency: "$",
  });

  // Join form event handlers
  const handleChangeJoinCode = ev => setJoinCode(ev.target.value);
  const handleChangeJoinName = ev => setJoinName(ev.target.value);
  const handleClickJoinLobby = async () => {
    // Clear errors and set page loading
    setJoinError(undefined);
    globalDispatch({ type: global.GlobalStateAction.PAGE_LOADING_START });

    console.warn("JOINDATA", {
      code: joinMode === LobbyJoinMode.JOIN ? joinCode : undefined,
      name: joinName,
      options: gameOptions,
    });

    // Hit the API to join/create lobby
    const resp = await api.makeRequest("post", "/api/join", {
      code: joinMode === LobbyJoinMode.JOIN ? joinCode : undefined,
      name: joinName,
      options: gameOptions,
    });

    // If there's an error, surface it to the user
    if (resp.error) {
      const errorText =
        globalState.preflight.bundleMap[resp.error] || resp.error;
      setJoinError(errorText);
    }

    // Else, store the user ID
    else {
      globalDispatch({
        type: global.GlobalStateAction.PLAYER_ID_SET,
        payload: resp.payload,
      });
    }

    globalDispatch({ type: global.GlobalStateAction.PAGE_LOADING_STOP });
  };

  // Event handler for changing game options
  const handleOptionChange = React.useCallback(event => {
    // If this is a synthetic event, persist it so as to not
    // risk the event disappearing before the state setter callbacks are invoked
    if (event.persist) {
      event.persist();
    }

    const key = event.target.dataset.optionKey;
    switch (key) {
      case "unlimitedBank":
      case "freeParking":
        setGameOptions(prevOptions => ({
          ...prevOptions,
          [key]: event.target.checked,
        }));
        break;

      case "maxPlayers":
      case "bankBalance":
      case "startingBalance":
        setGameOptions(prevOptions => ({
          ...prevOptions,
          [key]: event.target.value ? parseInt(event.target.value, 10) : "",
        }));
        break;

      case "currency":
        setGameOptions(prevOptions => ({
          ...prevOptions,
          [key]: event.option,
        }));
        break;

      default:
        break;
    }
  }, []);

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
            To create a lobby, you must first choose your game options.
          </BulletedInstruction>
          <VerticalSpacer factor={1} />

          <AlignedCheckBoxContainer>
            <CheckBox
              reverse={true}
              label="Unlimited bank funds:"
              data-option-key="unlimitedBank"
              checked={gameOptions.unlimitedBank}
              onChange={handleOptionChange}
            />
          </AlignedCheckBoxContainer>

          <VerticalSpacer factor={0.382} />

          <AlignedCheckBoxContainer>
            <CheckBox
              reverse={true}
              label="Free parking account:"
              data-option-key="freeParking"
              checked={gameOptions.freeParking}
              onChange={handleOptionChange}
            />
          </AlignedCheckBoxContainer>

          <VerticalSpacer factor={0.382} />

          <AlignedFormField label="Maximum number of players:">
            <TextInput
              placeholder="type here"
              type="number"
              data-option-key="maxPlayers"
              value={gameOptions.maxPlayers}
              onChange={handleOptionChange}></TextInput>
          </AlignedFormField>

          <VerticalSpacer factor={0.382} />

          <AlignedFormField label="Bank total funds:">
            <TextInput
              placeholder="type here"
              type="number"
              data-option-key="bankBalance"
              value={gameOptions.bankBalance}
              onChange={handleOptionChange}
              disabled={gameOptions.unlimitedBank}></TextInput>
          </AlignedFormField>

          <VerticalSpacer factor={0.382} />

          <AlignedFormField label="Player starting balance:">
            <TextInput
              placeholder="type here"
              type="number"
              data-option-key="startingBalance"
              value={gameOptions.startingBalance}
              onChange={handleOptionChange}></TextInput>
          </AlignedFormField>

          <VerticalSpacer factor={0.382} />

          <AlignedFormField label="Game currency:">
            <Select
              options={["$", "£"]}
              data-option-key="currency"
              value={gameOptions.currency}
              onChange={handleOptionChange}
            />
          </AlignedFormField>

          <VerticalSpacer factor={1} />
          <hr style={{ margin: "0" }} />
          <VerticalSpacer factor={1} />

          <BulletedInstruction n="3">
            Then, just enter your name below and press the button.
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
