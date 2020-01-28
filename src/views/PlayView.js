// Vendor imports
import { Box, Button, Text, ThemeContext } from "grommet";
import * as polished from "polished";
import React from "react";
import reactStringReplace from "react-string-replace";
import styled from "styled-components";

// Local imports
import PlayerAvatar from "../components/PlayerAvatar";
import VerticalSpacer from "../components/VerticalSpacer";
import * as global from "../config/state";
import * as api from "../util/api";

// Asset imports
import { ReactComponent as BankIcon } from "../assets/icons/noun_Piggy Bank_2342153.svg";
import { ReactComponent as FPIcon } from "../assets/icons/noun_Parking_451846.svg";
import { ReactComponent as TransactionIcon } from "../assets/icons/noun_transaction_763895.svg";

const LobbyInfoLineSpacer = styled.span`
  flex-grow: 1;
  display: inline-block;
`;

const LobbyInfoLine = styled(Text)`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  > em {
    margin-left: 0.5rem;
    border-radius: 2em;
    height: 1.3em;
    padding: 0.15em 0.5em;

    background: ${props => props.theme.global.colors.brandAlt};

    font-style: normal;
    color: ${props => props.theme.global.colors.text.dark};
  }
`;

const MoneyBoxBalanceLine = styled.span`
  grid-column: 1 / span 2;

  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;

  margin-top: 0.618rem;

  font-size: 1.382rem;

  > code {
    flex-grow: 1;

    border-bottom: 1px dashed ${props => props.theme.global.colors.text.light};
    margin-left: calc(${props => props.theme.global.spacing} / 2 - 0.25rem);
    padding: 0.25rem;

    background: rgba(255, 255, 255, 0.5);

    font-size: 2rem;
  }
`;

const MoneyBoxNoTransfer = styled.div`
  border-radius: 0.5rem;
  margin: 0.618rem 0.5rem 0;
  width: 1rem;
  height: 1rem;

  background: ${props =>
    polished.darken(0.1, props.theme.global.colors.monopolyPaleGreen)};
`;

const MoneyBox = styled(Box)`
  display: grid;
  grid-template: 4rem auto auto / 4rem auto 2rem;
  grid-column-gap: calc(${props => props.theme.global.spacing} / 4);
  align-items: center;

  border: 1px solid ${polished.darken(0.1, "#cae8e0")};
  border-radius: 2px;

  background: #cae8e0;

  > svg {
    fill: ${props => props.theme.global.colors.brandAlt};
  }

  > h2 {
    grid-column: 2 / span 2;

    margin: 0;
  }

  > button {
    margin-top: 0.618rem;
    padding: 2px;

    fill: ${props => props.theme.global.colors.text.light};
  }
`;

const LogBox = styled(Box)`
  border: 1px solid ${polished.darken(0.1, "#e87024")};
  border-radius: 2px;

  background: #e87024;

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
  // Global state reducer
  const [globalState] = React.useContext(global.GlobalStateContext);

  const getPlayer = id => {
    return globalState.poll.players.filter(ply => ply._id === id)[0];
  };

  const formatEvent = event => {
    const eventText = globalState.preflight.bundleMap[event.key];
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
                    <u key={i}>
                      {globalState.preflight.bundleMap[insertValue]}
                    </u>
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

  const isBanker = globalState.playerId === globalState.poll.banker;

  // List of "money boxes" representing the different balances
  const moneyBoxList = [
    {
      icon: <PlayerAvatar playerId={globalState.playerId} size="4rem" />,
      title: "My funds",
      balance: getPlayer(globalState.playerId).balance,
      transferable: true,
    },
    {
      icon: <BankIcon />,
      title: "The Bank",
      balance: globalState.poll.bank,
      transferable: isBanker,
    },
    {
      icon: <FPIcon />,
      title: "Free Parking",
      balance: globalState.poll.freeParking,
      transferable: isBanker,
    },
  ];

  return (
    <>
      {/* Show the lobby code */}
      <LobbyInfoLine>
        Lobby code: <em>{globalState.poll.code}</em>
        {isBanker && (
          <>
            <LobbyInfoLineSpacer />
            {/* Expires: {console.warn("LOBBY", lobbyData.get().expires)} */}
          </>
        )}
      </LobbyInfoLine>
      <VerticalSpacer factor={0.618} />

      {/* Map and insert all the money boxes */}
      {moneyBoxList.map(moneyBox => (
        <React.Fragment key={moneyBox.title}>
          <MoneyBox pad="xsmall" elevation="small">
            {/* <img src={moneyBox.icon} alt="resource icon" /> */}
            {moneyBox.icon}
            <h2>{moneyBox.title}</h2>
            <MoneyBoxBalanceLine aria-hidden={true}>
              $<code>{moneyBox.balance}</code>
            </MoneyBoxBalanceLine>
            {moneyBox.transferable ? (
              <Button icon={<TransactionIcon />} plain={false} />
            ) : (
              <MoneyBoxNoTransfer aria-hidden={true} />
            )}
            {/* {moneyBox.transferable && <TransferButton label="Transfer" />} */}
          </MoneyBox>
          <VerticalSpacer factor={0.382} />
        </React.Fragment>
      ))}

      {/* Modify the theme to insert the event log */}
      <ThemeContext.Extend
        value={{ global: { colors: { text: { light: "#222222" } } } }}>
        <LogBox pad="xsmall" elevation="small">
          <h4>Event Log</h4>
          <ul>
            {globalState.events.map(event => (
              <li key={event._id}>{formatEvent(event)}</li>
            ))}
          </ul>
        </LogBox>
      </ThemeContext.Extend>
    </>
  );
}
