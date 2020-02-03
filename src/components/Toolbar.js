// Vendor imports
// import React from "react";
import styled from "styled-components";

export const ToolbarContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: stretch;

  background: ${props => props.theme.global.colors.brand};
`;

export const ToolbarRail = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  margin: 0 ${props => props.theme.global.spacing};
  width: calc(100vw - ${props => props.theme.global.spacing} * 2);
  max-width: calc(512px - ${props => props.theme.global.spacing} * 2);

  color: white;
`;

export const ToolbarTitle = styled.h1`
  margin: 0;

  font-size: 1.618rem;
  font-weight: ${props => props.theme.global.font.weights.bold};
`;
