// Vendor imports
import React from "react";
import styled from "styled-components";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: flex-start;

  /* margin-bottom: 1rem; */
`;

const Number = styled.div`
  flex-shrink: 0;

  display: flex;
  justify-content: center;
  align-items: center;

  border-radius: calc(${props => props.theme.checkBox.size} / 2);
  width: ${props => props.theme.checkBox.size};
  height: ${props => props.theme.checkBox.size};

  background: ${props => props.theme.global.colors["accent-1"]};
  color: ${props => props.theme.global.colors.text.light};
`;

const Body = styled.p`
  flex-grow: 1;

  /* margin: 0.25rem 0 0 0.5rem; */
  margin: 0 0 0 calc(${props => props.theme.global.spacing} / 2);
`;

export default function BulletedInstruction(props) {
  return (
    <Container>
      <Number>{props.n}</Number>
      <Body>{props.children}</Body>
    </Container>
  );
}
