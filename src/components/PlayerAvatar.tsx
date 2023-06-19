// Vendor imports
import React from 'react';
import styled from 'styled-components';

// Local imports
import { GlobalStateContext } from '../utils/state';
import { Player } from '../api/APITypes';

const outerRingSize = '4px';

const Container = styled.div<{ highlight: boolean; size: number }>`
  box-sizing: border-box;

  border: ${outerRingSize} solid
    ${(props) =>
      props.highlight ? '#FFD300' : props.theme.global.colors.text.light};
  border-radius: calc(${(props) => props.size}px / 2);
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;

  background: white;
`;

const Backdrop = styled.div<{ playerId: string; size: number }>`
  box-sizing: border-box;

  overflow: hidden;

  /* margin: ${outerRingSize}; */
  border: 2px solid white;
  border-radius: calc((${(props) => props.size}px - ${outerRingSize}) / 2);
  width: calc(${(props) => props.size}px - ${outerRingSize} * 2);
  height: calc(${(props) => props.size}px - ${outerRingSize} * 2);

  background: url(https://api.dicebear.com/6.x/adventurer-neutral/svg?seed=${(
    props,
  ) => props.playerId});
  background-position: center;
  background-size: contain;

  > img {
    width: calc(${(props) => props.size} - ${outerRingSize} * 2);
  }
`;

export interface PlayerAvatarProps {
  player: Player | undefined;
  size?: number;
}

export default function PlayerAvatar({ player, size = 64 }: PlayerAvatarProps) {
  // Global state reducer
  const globalState = React.useContext(GlobalStateContext);

  const isBanker =
    !!globalState.lobby &&
    (player?._id.$oid ?? '') === globalState.lobby.banker.$oid;

  return (
    <Container size={size} highlight={isBanker}>
      {player && <Backdrop size={size} playerId={player._id.$oid} />}
    </Container>
  );
}
