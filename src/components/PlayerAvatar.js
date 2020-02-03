// Vendor imports
import React from "react";
import styled from "styled-components";

// Local imports
import * as global from "../config/state";

const outerRingSize = "4px";

const Container = styled.div`
  box-sizing: border-box;

  border: ${outerRingSize} solid
    ${props =>
      props.highlight ? "#FFD300" : props.theme.global.colors.text.light};
  border-radius: calc(${props => props.size} / 2);
  width: ${props => props.size};
  height: ${props => props.size};

  background: white;
`;

const Backdrop = styled.div`
  box-sizing: border-box;

  overflow: hidden;

  /* margin: ${outerRingSize}; */
  border: 2px solid white;
  border-radius: calc((${props => props.size} - ${outerRingSize}) / 2);
  width: calc(${props => props.size} - ${outerRingSize} * 2);
  height: calc(${props => props.size} - ${outerRingSize} * 2);


  /* background: url(https://api.adorable.io/avatars/256/${props =>
    props.playerId}.png); */
  background: url(https://avatars.dicebear.com/v2/human/${props =>
    props.playerId}.svg);
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
