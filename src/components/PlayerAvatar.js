// Vendor imports
import React from "react";
import styled, { css } from "styled-components";

// Local imports
import * as global from "../config/state";

const outerRingSize = "4px";

const Container = styled.div`
  border-radius: calc(${props => props.size} / 2);
  width: ${props => props.size};
  height: ${props => props.size};

  background: ${props => (props.highlight ? "#FFD300" : "white")};

  ${props =>
    props.highlight &&
    css`
      > div {
        border: 2px solid white;
      }
    `}
`;

const Backdrop = styled.div`
  box-sizing: border-box;

  overflow: hidden;

  margin: ${outerRingSize};
  border-radius: calc((${props => props.size} - ${outerRingSize}) / 2);
  width: calc(${props => props.size} - ${outerRingSize} * 2);
  height: calc(${props => props.size} - ${outerRingSize} * 2);

  background: url(https://api.adorable.io/avatars/256/${props => props.playerId}.png);
  background-position: center;
  background-size: contain;

  > img {
    width: calc(${props => props.size} - ${outerRingSize} * 2);
  }
`;

export default function PlayerAvatar(props) {
  // Global state reducer
  const [globalState] = React.useContext(global.GlobalStateContext);

  const isBanker =
    globalState.poll && props.playerId === globalState.poll.banker;

  return (
    <Container size={props.size} highlight={isBanker}>
      <Backdrop size={props.size} playerId={props.playerId} />
    </Container>
  );
}
