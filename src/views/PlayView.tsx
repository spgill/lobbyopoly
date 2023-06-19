// Vendor imports
import { Box, Button, Heading, Text, ThemeContext, Spinner } from 'grommet';
import * as polished from 'polished';
import React, { useCallback, useMemo } from 'react';
import reactStringReplace from 'react-string-replace';
import styled from 'styled-components';
import { Send } from 'grommet-icons';

// Local imports
import PlayerAvatar from '../components/PlayerAvatar';
import VerticalSpacer from '../components/VerticalSpacer';
import { GlobalStateContext } from '../utils/state';
import useTransferLayer from '../layers/TransferLayer';
import { Event } from '../api/APITypes';

// Asset imports
import { ReactComponent as BankIcon } from '../assets/icons/noun_Piggy Bank_2342153.svg';
import { ReactComponent as FPIcon } from '../assets/icons/noun_Parking_451846.svg';
import { ReactComponent as TransactionIcon } from '../assets/icons/noun_transaction_763895.svg';

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

    background: ${(props) => props.theme.global.colors.brandAlt};

    font-style: normal;
    color: ${(props) => props.theme.global.colors.text.dark};
  }

  > u {
    margin-left: 0.618ch;
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

    border-bottom: 1px dashed ${(props) => props.theme.global.colors.text.light};
    margin-left: calc(${(props) => props.theme.global.spacing} / 2 - 0.25rem);
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

  background: ${(props) =>
    polished.darken(0.1, props.theme.global.colors.monopolyPaleGreen)};
`;

const MoneyBox = styled(Box)`
  display: grid;
  grid-template: 4rem auto auto / 4rem auto 2rem;
  grid-column-gap: calc(${(props) => props.theme.global.spacing} / 4);
  align-items: center;

  border: 1px solid ${polished.darken(0.1, '#cae8e0')};
  border-radius: 2px;

  background: #cae8e0;

  > svg {
    fill: ${(props) => props.theme.global.colors.brandAlt};
  }

  > h2 {
    grid-column: 2 / span 2;

    margin: 0;
  }

  > button {
    margin-top: 0.618rem;
    padding: 2px;

    fill: ${(props) => props.theme.global.colors.text.light};
  }
`;

const LogBox = styled(Box)`
  border: 1px solid ${polished.darken(0.1, '#e87024')};
  border-radius: 2px;

  background: #e87024;

  > h4 {
    margin: 0;
  }

  > ul {
    margin-top: calc(${(props) => props.theme.global.spacing} / 2);
    margin-bottom: calc(${(props) => props.theme.global.spacing} / 2);
    padding-left: calc(${(props) => props.theme.global.spacing} * 0.8);
  }
`;

const CenteredSpinner = styled(Spinner)`
  margin: ${(props) => props.theme.global.spacing} auto;
`;

export default function PlayView() {
  // Global state reducer
  const globalState = React.useContext(GlobalStateContext);

  // Call transfer layer hook
  const [startTransfer, transferLayerComponent] = useTransferLayer();

  const formatEvent = useCallback(
    (event: Event) => {
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
                const [insertKind, insertValueRaw] = insert;
                let insertValue: number | string;
                if (insertKind === 'player') {
                  insertValue = insertValueRaw.$oid;
                } else {
                  insertValue = insertValueRaw;
                }

                const ply = globalState.lobby?.players.filter(
                  (plyX) => plyX._id.$oid === insertValue,
                )[0];

                switch (insertKind) {
                  // Player inserts should lookup and return player name
                  case 'player':
                    return (
                      <u key={i}>{ply ? ply.name : <em>disconnected</em>}</u>
                    );

                  // Common inserts should look up the string from the bundle
                  case 'bundle':
                    return (
                      <u key={i}>
                        {globalState.preflight.bundleMap[insertValue]}
                      </u>
                    );

                  // Currency bundles just need the right currency symbol
                  case 'currency':
                    return (
                      <u key={i}>
                        {globalState.lobby?.options.currency}
                        {insertValue}
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

            return undefined;
          });
    },
    [globalState],
  );

  const isBanker = globalState.playerId === globalState.lobby?.banker.$oid;

  // List of "money boxes" representing the different balances
  const moneyBoxList = useMemo(() => {
    const boxes = [
      {
        key: 'player',
        icon: <PlayerAvatar player={globalState.currentPlayer} size={4 * 16} />,
        title: globalState.currentPlayer?.name,
        balance: globalState.currentPlayer?.balance ?? 0,
        transferable: true,
        transferSource: globalState.preflight.transferEntityMap.SELF,
      },
      {
        key: 'bank',
        icon: <BankIcon />,
        title: 'The Bank',
        balance: globalState.lobby?.options.unlimitedBank
          ? '∞'
          : globalState.lobby?.bank,
        transferable: isBanker,
        transferSource: globalState.preflight.transferEntityMap.BANK,
      },
    ];

    if (globalState.lobby?.options.freeParking) {
      boxes.push({
        key: 'free-parking',
        icon: <FPIcon />,
        title: 'Free Parking',
        balance: globalState.lobby?.freeParking,
        transferable: isBanker,
        transferSource: globalState.preflight.transferEntityMap.FP,
      });
    }

    return boxes;
  }, [globalState, isBanker]);

  return (
    <>
      {/* Insert the rendered transfer layer */}
      {transferLayerComponent}

      {/* Show the lobby code */}
      <LobbyInfoLine>
        {isBanker && (
          <>
            {/* TODO: add proper processing of date times */}
            {/* Expires: <u>{globalState.lobby.expires.fromNow()}</u> */}
          </>
        )}
        <LobbyInfoLineSpacer />
        Lobby code: <em>{globalState.lobby?.code}</em>
      </LobbyInfoLine>
      <VerticalSpacer factor={0.382} />

      {/* Map and insert all the money boxes */}
      {moneyBoxList.map((moneyBox) => (
        <React.Fragment key={moneyBox.key}>
          <MoneyBox pad="xsmall" elevation="small">
            {/* <img src={moneyBox.icon} alt="resource icon" /> */}
            {moneyBox.icon}
            <Heading level={2}>{moneyBox.title}</Heading>
            <MoneyBoxBalanceLine>
              {globalState.lobby?.options.currency}
              <code>{moneyBox.balance}</code>
            </MoneyBoxBalanceLine>
            {moneyBox.transferable ? (
              <Button
                icon={<Send />}
                plain={false}
                onClick={() => startTransfer(moneyBox.transferSource)}
              />
            ) : (
              <MoneyBoxNoTransfer aria-hidden />
            )}
            {/* {moneyBox.transferable && <TransferButton label="Transfer" />} */}
          </MoneyBox>
          <VerticalSpacer factor={0.382} />
        </React.Fragment>
      ))}

      {/* Modify the theme to insert the event log */}
      <ThemeContext.Extend
        value={{ global: { colors: { text: { light: '#222222' } } } }}
      >
        {(globalState.events?.length ?? 0) > 0 ? (
          <LogBox pad="xsmall" elevation="small">
            <h4>Event Log</h4>
            <ul>
              {[...(globalState.events ?? [])].reverse().map((event) => (
                <li key={event._id.$oid}>{formatEvent(event)}</li>
              ))}
            </ul>
          </LogBox>
        ) : (
          <CenteredSpinner />
        )}
      </ThemeContext.Extend>
    </>
  );
}
