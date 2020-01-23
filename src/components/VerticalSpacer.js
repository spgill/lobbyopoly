// Vendor imports
import styled from "styled-components";

export default styled.div`
  height: calc(
    ${props => props.theme.global.spacing} * ${props => props.factor || 1.0}
  );
`;
