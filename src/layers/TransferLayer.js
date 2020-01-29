// Vendor imports
import {
  Box,
  Button,
  FormField,
  Layer,
  Select,
  SelectTextInput,
} from "grommet";
import { FormClose } from "grommet-icons";
import React from "react";
import styled from "styled-components";

// Local imports
import PlayerAvatar from "../components/PlayerAvatar";
import VerticalSpacer from "../components/VerticalSpacer";
import * as global from "../config/state";

// Asset imports
import { ReactComponent as BankIcon } from "../assets/icons/noun_Piggy Bank_2342153.svg";
import { ReactComponent as FPIcon } from "../assets/icons/noun_Parking_451846.svg";

const StyledOptionBox = styled(Box)`
  display: grid;
  grid-template: 2rem / 2rem max-content;
  grid-column-gap: calc(${props => props.theme.global.spacing} / 4);
  align-items: center;

  > svg {
    fill: ${props => props.theme.global.colors.brandAlt};
  }
`;

function OptionBox({ target }) {
  return (
    <StyledOptionBox pad="small">
      {target.icon}
      {target.label}
    </StyledOptionBox>
  );
}

export default function useRulesLayer() {
  // Global state reducer
  const [globalState] = React.useContext(global.GlobalStateContext);

  // Local state vars
  const [isOpen, setOpen] = React.useState(false);
  const [transferSource, setTransferSource] = React.useState(null);
  const [transferTarget, setTransferTarget] = React.useState(null);

  // Event handlers for opening and closing
  const closeHandler = React.useCallback(() => setOpen(false), []);
  const startTransfer = React.useCallback(source => {
    setTransferSource(source);
    setTransferTarget(null);
    setOpen(true);
  }, []);

  // Event handler for changing selection
  const handleChangeTarget = React.useCallback(
    event => setTransferTarget(event.option),
    [],
  );

  // Construct a list of targets, based on the source
  const nonPlayerSource = [
    globalState.preflight.transferEntityMap.BANK,
    globalState.preflight.transferEntityMap.FP,
  ].includes(transferSource);
  const transferTargetList = [
    // Bank target entry
    transferSource !== globalState.preflight.transferEntityMap.BANK && {
      icon: <BankIcon />,
      label: "The Bank",
      value: globalState.preflight.transferEntityMap.BANK,
    },

    // Free parking target entry
    transferSource !== globalState.preflight.transferEntityMap.FP &&
      globalState.poll.options.freeParking && {
        icon: <FPIcon />,
        label: "Free Parking",
        value: globalState.preflight.transferEntityMap.FP,
      },

    // Iterate over all player and generate target entries
    ...globalState.poll.players
      .filter(ply => ply._id !== globalState.playerId || nonPlayerSource)
      .map(ply => ({
        icon: <PlayerAvatar playerId={ply._id} size="2rem" />,
        label: ply.name,
        value: ply._id,
      })),
  ].filter(Boolean);
  const currentTarget = transferTarget || transferTargetList[0];

  // Render the component
  const rendered = isOpen && (
    <Layer
      margin="large"
      responsive={false}
      full={false}
      modal={true}
      onClickOutside={closeHandler}
      onEsc={closeHandler}>
      <Box pad="medium">
        <FormField label="Select transfer destination">
          <Select
            options={transferTargetList.filter(
              option => option.value !== currentTarget.value,
            )}
            disabled={transferTargetList.length <= 1}
            value={currentTarget}
            onChange={handleChangeTarget}
            valueLabel={
              <OptionBox key={currentTarget.value} target={currentTarget} />
            }
            children={(option, idx, options, status) => (
              <OptionBox key={option.value} target={option} />
            )}
          />
        </FormField>
      </Box>
    </Layer>
  );

  return [startTransfer, rendered];
}
