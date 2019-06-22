// Vendor imports
// import React from "react";
import styled from "styled-components";

export const ToolbarContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  padding: 0 calc((100vw - 512px) / 2);

  background: ${props => props.theme.global.colors.brand};

  color: white;

  > *:first-child {
    margin-left: 0.5rem;
  }

  > *:last-child {
    margin-right: 0.5rem;
  }
`;

export const ToolbarTitle = styled.h1`
  margin: 0;

  font-size: 1.618rem;
  font-weight: ${props => props.theme.global.font.weights.bold};
`;
