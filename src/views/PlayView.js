// Vendor imports
import { Box, Button, TextInput } from "grommet";
import * as hookstate from "@hookstate/core";
import React from "react";
import styled from "styled-components";

// Local imports
import BulletedInstruction from "../components/BulletedInstruction";
import VerticalSpacer from "../components/VerticalSpacer";
import * as global from "../config/state";
import * as api from "../util/api";
import * as enumutil from "../util/enum";

function formatEventInsert(el) {
  return `<span style="color: #91721f;">${el}</span>`;
}

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
  );
}
