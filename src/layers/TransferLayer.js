// Vendor imports
import { Box, Button, FormField, Layer, Select, Text } from "grommet";
import { Revert, Send } from "grommet-icons";
import React from "react";
import styled from "styled-components";

// Local imports
import PlayerAvatar from "../components/PlayerAvatar";
import VerticalSpacer from "../components/VerticalSpacer";
import * as global from "../config/state";
import * as api from "../util/api";

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

const TransferMeter = styled(Text)`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  font-size: 4rem;

  > sup {
    align-self: flex-start;

    display: inline-block;

    margin-top: 0.5em;

    font-size: 0.5em;
  }

  > code {
    flex-grow: 1;

    line-height: 1em;
  }
`;

const BillButton = styled(Button)`
  grid-column-end: span ${props => props.span || 1};
`;

const BillButtonMatrix = styled.div`
  display: grid;
  grid-template: 2rem auto repeat(3, 2rem) auto 2rem / 1fr 1fr 1fr;
  grid-gap: calc(${props => props.theme.global.spacing} / 4);

  > hr {
    grid-column-end: span 3;

    margin: calc(${props => props.theme.global.spacing} / 4) 0;
    border: none;
    border-bottom: 1px solid ${props => props.theme.global.colors.border.light};
    width: 100%;
  }
`;

export default function useRulesLayer() {
  // Global state reducer
  const [globalState, globalDispatch] = React.useContext(
    global.GlobalStateContext,
  );

  // Local state vars
  const [isOpen, setOpen] = React.useState(false);
  const [transferSource, setTransferSource] = React.useState(null);
  const [transferTarget, setTransferTarget] = React.useState(null);
  const [transferAmount, setTransferAmount] = React.useState(0);
  const [transferError, setTransferError] = React.useState(null);

  // Event handlers for opening and closing
  const closeHandler = React.useCallback(() => setOpen(false), []);
  const startTransfer = React.useCallback(source => {
    setTransferSource(source);
    setTransferTarget(null);
    setTransferAmount(0);
    setTransferError(null);
    setOpen(true);
  }, []);

  // Event handler for changing selection
  const handleChangeTarget = React.useCallback(
    event => setTransferTarget(event.option),
    [],
  );

  // Function to get the source's current balance
  const getSourceBalance = () => {
    switch (transferSource) {
      case globalState.preflight.transferEntityMap.SELF:
        return globalState.currentPlayer.balance;
      case globalState.preflight.transferEntityMap.BANK:
        return globalState.poll.bank;
      case globalState.preflight.transferEntityMap.FP:
        return globalState.poll.freeParking;
      default:
        return 0;
    }
  };

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

  // Handler for starting sending transfer
  const handleClickSend = async () => {
    // Trigger the page loading animation
    globalDispatch({ type: global.GlobalStateAction.PAGE_LOADING_START });

    // Fire off the transfer request
    const transferResponse = await api.makeRequest("post", "/api/transfer", {
      source: transferSource,
      destination: currentTarget._id || currentTarget.value,
      amount: transferAmount,
    });

    // Update the transfer error
    setTransferError(transferResponse.error);

    // Stop the page loading animation
    globalDispatch({ type: global.GlobalStateAction.PAGE_LOADING_STOP });

    // If the transfer was successfull, close the dialog
    if (!transferResponse.error) {
      closeHandler();
    }
  };

  // Create list of money buttons
  const billButtonList = [
    {
      amount: 1,
      color: "#e3dac9",
      span: true,
    },
    {
      amount: 5,
      color: "#e5c0b8",
      span: false,
    },
    {
      amount: 10,
      color: "#e8dea9",
      span: false,
    },
    {
      amount: 20,
      color: "#95c1b2",
      span: false,
    },
    {
      amount: 50,
      color: "#9eced0",
      span: false,
    },
    {
      amount: 100,
      color: "#dec682",
      span: false,
    },
    {
      amount: 500,
      color: "#e5b42b",
      span: false,
    },
  ];

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
        {/* Transfer target selection */}
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

        <VerticalSpacer />

        <Text>How much do you want to send?</Text>

        <TransferMeter>
          <sup>{globalState.poll.options.currency}</sup>
          <code>{transferAmount}</code>
          <Button icon={<Revert />} onClick={() => setTransferAmount(0)} />
        </TransferMeter>

        <VerticalSpacer />

        <BillButtonMatrix>
          <BillButton
            label={`${globalState.poll.options.currency}200`}
            onClick={() => setTransferAmount(200)}
            disabled={globalState.pageLoading}
          />
          <BillButton
            label="10%"
            onClick={() =>
              setTransferAmount(Math.round(getSourceBalance() * 0.1))
            }
            disabled={globalState.pageLoading}
          />
          <BillButton
            label="ALL"
            onClick={() => setTransferAmount(getSourceBalance())}
            disabled={globalState.pageLoading}
          />
          <hr />
          {billButtonList.map(btn => (
            <BillButton
              key={btn.amount}
              color={btn.color}
              primary={true}
              label={`${globalState.poll.options.currency}${btn.amount}`}
              span={btn.span ? 3 : 1}
              onClick={() => setTransferAmount(curr => curr + btn.amount)}
              disabled={globalState.pageLoading}
            />
          ))}
          <hr />
          <BillButton
            label="Cancel"
            onClick={closeHandler}
            disabled={globalState.pageLoading}
          />
          <BillButton
            label="Send"
            icon={<Send />}
            reverse={true}
            primary={true}
            span={2}
            onClick={handleClickSend}
            disabled={globalState.pageLoading || transferAmount <= 0}
          />
        </BillButtonMatrix>

        {/* Show transfer errors */}
        {transferError && (
          <>
            <VerticalSpacer factor={0.382} />
            <Text color="status-critical">
              {globalState.preflight.bundleMap[transferError]}
            </Text>
          </>
        )}
      </Box>
    </Layer>
  );

  return [startTransfer, rendered];
}
