// Vendor imports
import { Box, Button, Text, ThemeContext } from "grommet";
import * as hookstate from "@hookstate/core";
import React from "react";
import reactStringReplace from "react-string-replace";
import styled from "styled-components";

// Local imports
import BulletedInstruction from "../components/BulletedInstruction";
import VerticalSpacer from "../components/VerticalSpacer";
import * as global from "../config/state";
import * as api from "../util/api";
import * as enumutil from "../util/enum";

const MoneyBox = styled(Box)`
  > h2 {
    margin: 0;
  }
`;

const LogBox = styled(Box)`
  > h4 {
    margin: 0;
  }

  > ul {
    margin-top: calc(${props => props.theme.global.spacing} / 2);
    margin-bottom: calc(${props => props.theme.global.spacing} / 2);
    padding-left: calc(${props => props.theme.global.spacing} * 0.8);
  }
`;

export default function PlayView(props) {
  // Global state vars
  const preflightData = hookstate.useStateLink(global.preflightDataLink);
  const playerId = hookstate.useStateLink(global.playerIdLink);
  const lobbyData = hookstate.useStateLink(global.lobbyDataLink);
  const lobbyEvents = hookstate.useStateLink(global.lobbyEventsLink);

  const getPlayer = id => {
    return lobbyData.get().players.filter(ply => ply._id === id)[0];
  };

  const formatEvent = event => {
    const eventText = preflightData.get().bundleMap[event.key];
    return eventText === undefined
      ? event.key
      : reactStringReplace(eventText, /\{(\d+)\}/g, (match, i) => {
          const idx = parseInt(match, 10);
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
                  return (
                    <u key={i}>{ply ? ply.name : <em>disconnected</em>}</u>
                  );

                // Common inserts should look up the string from the bundle
                case "bundle":
                  return (
                    <u key={i}>{preflightData.get().bundleMap[insertValue]}</u>
                  );

                // Else, just try and jsonify the value
                default:
                  return <u key={i}>{JSON.stringify(insertValue)}</u>;
              }

              // If it's not an object, just try returning it (it's prolly a string)
            } else {
              return <u key={i}>{insert}</u>;
            }
          }
        });
  };

  return (
    <>
      {/* Show the lobby code */}
      <Text>
        Lobby code: <code>{lobbyData.get().code}</code>
      </Text>
      <VerticalSpacer factor={0.618} />

      <MoneyBox pad="xsmall" background="#cae8e0">
        <h2>My funds</h2>
        <code>{getPlayer(playerId.get()).balance}</code>
        <VerticalSpacer factor={0.382} />
        <Button label="Transfer" />
      </MoneyBox>
      <VerticalSpacer factor={0.382} />

      <MoneyBox pad="xsmall" background="#cae8e0">
        <h2>Bank</h2>
        <code>{lobbyData.get().bank}</code>
        <VerticalSpacer factor={0.382} />
        <Button label="Transfer" />
      </MoneyBox>
      <VerticalSpacer factor={0.382} />

      <MoneyBox pad="xsmall" background="#cae8e0">
        <h2>Free Parking</h2>
        <code>{lobbyData.get().freeParking}</code>
        <VerticalSpacer factor={0.382} />
        <Button label="Transfer" />
      </MoneyBox>
      <VerticalSpacer factor={0.382} />

      <ThemeContext.Extend
        value={{ global: { colors: { text: { light: "#222222" } } } }}>
        <LogBox pad="xsmall" background="#e87024">
          <h4>Event Log</h4>
          <ul>
            {lobbyEvents.get().map(event => (
              <li key={event._id}>{formatEvent(event)}</li>
            ))}
          </ul>
        </LogBox>
      </ThemeContext.Extend>
    </>
  );
}
