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

  border-radius: 1rem;
  width: 2rem;
  height: 2rem;

  background: ${props => props.theme.global.colors["accent-1"]};
  color: ${props => props.theme.global.colors.text.light};
`;

const Body = styled.p`
  flex-grow: 1;

  margin: 0.25rem 0 0 0.5rem;
`;

export default function BulletedInstruction(props) {
  return (
    <Container>
      <Number>{props.n}</Number>
      <Body>{props.children}</Body>
    </Container>
  );
}
