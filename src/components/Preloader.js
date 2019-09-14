// Vendor imports
import React from "react";
import styled from "styled-components";

const PreloaderDot = styled.div`
  transition: opacity 100ms;

  border-radius: 10px;
  width: 20px;
  height: 20px;

  background: #565656;
  opacity: ${props => (props.show ? 1 : 0)};
`;

const PreloaderDie = styled.div`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 1000;

  display: grid;
  grid-template: 20px 20px 20px / 20px 20px 20px;
  justify-content: center;
  align-content: center;
  grid-gap: 12px;

  transform: scale(0.25);
  transform-origin: top left;

  border: 4px solid #565656;
  border-radius: 32px;
  width: 128px;
  height: 128px;

  background: #fffacd;
`;

const dotPatterns = [
  [0, 0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 0, 0],
  [0, 0, 1, 0, 1, 0, 1, 0, 0],
  [1, 0, 1, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 0, 1],
];

export default function Preloader() {
  const [dieValue, setDieValue] = React.useState(0);
  const [timeoutId, setTimeoutId] = React.useState(undefined);

  const incrementValue = React.useCallback(() => {
    setDieValue((dieValue + 1) % 6);
  }, [dieValue]);

  // Schedule timeout to change value
  React.useEffect(() => {
    setTimeoutId(setTimeout(incrementValue, 250));
  }, [incrementValue]);

  // Special cleanup function to cancel any outstanding timeouts
  React.useEffect(() => () => clearTimeout(timeoutId), [timeoutId]);

  return (
    <PreloaderDie aria-hidden={true}>
      {dotPatterns[dieValue].map((value, i) => (
        <PreloaderDot key={i} show={value} />
      ))}
    </PreloaderDie>
  );
}
