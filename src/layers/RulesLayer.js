// Vendor imports
import { Box, Button, Layer } from "grommet";
import { FormClose } from "grommet-icons";
import React from "react";
import styled from "styled-components";

const ScrollLayer = styled(Layer)`
  overflow-y: auto;
`;

const RulesBox = styled(Box)`
  > button {
    align-self: flex-end;
    width: unset;
  }
`;

export default function useRulesLayer() {
  // Local state vars
  const [isOpen, setOpen] = React.useState(false);

  // Event handlers for opening and closing
  const openHandler = React.useCallback(() => setOpen(true), []);
  const closeHandler = React.useCallback(() => setOpen(false), []);

  // Render the component
  const rendered = isOpen && (
    <ScrollLayer
      margin="large"
      responsive={true}
      full={false}
      modal={true}
      onClickOutside={closeHandler}
      onEsc={closeHandler}>
      <RulesBox pad="medium">
        <Button
          icon={<FormClose />}
          primary={true}
          plain={true}
          onClick={closeHandler}
        />
        <h1>Official Rules</h1>
        <p>
          The following are the rules as printed in the official Monopoly® rule
          Book, with annotations explaining how play works when playing with
          this application.
        </p>
        <section>
          <h2>Object</h2>
          <p>
            The object of the game is to become the wealthiest player through
            buying, renting, and selling of property.
          </p>
        </section>
        <section>
          <h2>Equipment</h2>
          <p>
            The equipment consists of a board, 2 dice, tokens, 32 houses, and 12
            Hotels. There are 16 Chance and 16 Community Chest cards, 28 Title
            Deed card (one for each property), and play money.
          </p>
          <p>
            <strong>
              This app is meant to be used in lieu of the play money.
            </strong>
          </p>
        </section>
        <section>
          <h2>Preparation</h2>
          <p>
            Place the board on a table and put the Chance and Community Chest
            cards face down on their allotted spaces on the board. Each player
            chooses one token to represent them while travelling around the
            board. Each player is given $1500 divided as follows: 2 $500's, 2
            $100's, 2 $50's, 6 $20's, 5 $10's, 5 $5's, and 5 $1's, for a total
            of $1500. All remaining money and other equipment go to the Bank.
          </p>
          <p>
            <strong>
              This app automatically transfers the starting amount to each
              player that joins the lobby.
            </strong>
          </p>
        </section>
        <section>
          <h2>Banker</h2>
          <p>
            Select as Banker a player who will also make a good Auctioneer. A
            Banker who plays in the game must keep their personal funds separate
            from those of the Bank. When more than five persons play, the Banker
            may elect to act only as Banker and Auctioneer.
          </p>
          <p>
            <strong>
              With this app, the player who creates the lobby is The Banker. The
              Banker is responsible for monitoring finances and managing payouts
              from The Bank and Free Parking (if applicable).
            </strong>
          </p>
        </section>
        <section>
          <h2>The Bank</h2>
          <p>
            Besides the Bank's money, the Bank holds the Title Deeds, and the
            houses and hotels prior to purchase by the players. The Bank pays
            salaries and bonuses. It sells and auctions properties and hands out
            the proper Title Deed cards when purchased by a player, it also
            sells houses and hotels to the players and loans money when required
            on mortgages. The Bank collects all taxes, fines, loans and
            interest, and the price of all properties which it sells and
            auctions. The Bank "never goes broke." If the Bank runs out of
            money, the Banker may issue as much as needed by writing on any
            ordinary paper.
          </p>
          <p>
            <strong>
              By default with this app, The Bank starts with the amount of
              "cash" that comes with the newer releases of the game, $20,580.
              The classic version of the game came with $15,140. You can also
              enable unlimited funds for the The Bank through the lobby creation
              options.
            </strong>
          </p>
        </section>
        <section>
          <h2>The Play</h2>
          <p>
            Starting with the Banker, each player in turn throws the dice. The
            player with the highest total starts the play. Place your token on
            the corner marked "GO", then throw the dice and move your token (in
            the direction of the arrow) the number of spaces indicated by the
            dice. After you have completed your play, the turn passes to the
            left. The tokens remain on the spaces occupied and proceed from that
            point on the player's next turn. Two or more tokens may rest on the
            same space at the same time. Depending on the space your token
            reaches, you may be entitled to buy real estate or other properties,
            or be obliged to pay rent, pay taxes, draw a Chance or Community
            Chest card, Go To Jail, or etc...
          </p>
          <p>
            If you throw doubles, you move your token as usual, the sum of the
            two dice, and are subject to any privileges or penalties pertaining
            to the space on which you land. Retaining the dice, throw again and
            move your token as before. If you throw doubles three times in
            succession, move your token immediately to the space marked "In
            Jail".
          </p>
        </section>
        <section>
          <h2>GO</h2>
          <p>
            Each time a player's token lands on or passes over GO, whether by
            throwing the dice or drawing a card, the Banker pays that player a
            $200 salary. The $200 is paid only once each time around the board.
            However, if a player passing GO on the throw of the dice lands 2
            spaces beyond it on Community Chest, or 7 spaces beyond it on
            Chance, and draws the "Advance to GO" card, they collect $200 for
            passing GO the first time, and another $200 for Advancing to it the
            second time by the instructions on the card.
          </p>
        </section>
        <section>
          <h2>Buying Property</h2>
          <p>
            Whenever you land on an unowned property you may buy that property
            from the Bank at its printed price. You receive the Title Deed card
            showing ownership. Place the title deed card face up in front of
            you. If you do not wish to buy the property, the Bank sells it at
            through an auction to the highest bidder. The high bidder pays the
            Bank the amount of the bid in cash and receives the Title Deed card
            for that property.
          </p>
          <p>
            <em>
              Any player, including the one who declined the option to buy it at
              the printed price, may bid. Bidding may start at any price.
            </em>
          </p>
        </section>
        <section>
          <h2>Paying Rent</h2>
          <p>
            When you land on a property that is owned by another player, the
            owner collects rent from you in accordance with the list printed on
            its Title Deed card. If the property is mortgaged, no rent can be
            collected. When a property is mortgaged, its Title Deed card is
            placed face down in front of the owner. It is an advantage to hold
            all the Title Deed cards in a color-group (i.e., Boardwalk and Park
            Place, or Connecticut, Vermont and Oriental Avenues) because the
            owner may then charge double rent for unimproved properties in that
            colour-group. This rule applies to unmortgaged properties even if
            another property in that colour-group is mortgaged. It is even more
            advantageous to have houses or hotels on properties because rents
            are much higher than for unimproved properties. The owner may not
            collect the rent if they fail to ask for it before the second player
            following throws the dice.
          </p>
        </section>
        <section>
          <h2>Change and Community Chest</h2>
          <p>
            When you land on either of these spaces, take the top card from the
            deck indicated, follow the instructions and return the card face
            down to the bottom of the deck. The "Get Out of Jail Free" card is
            held until used and then returned to the bottom of the deck. If the
            player who draws it does not wish to use it, then they may sell it,
            at any time, to another player at a price agreeable to both.
          </p>
        </section>
        <section>
          <h2>Income Tax</h2>
          <p>
            If you land here you have two options: You may estimate your tax at
            $200 and pay the Bank, or you may pay 10% of your total worth to the
            Bank. Your total worth is all your cash on hand, printed prices of
            mortgaged and unmortgaged properties and cost price of all buildings
            you own.
          </p>
          <p>
            <em>
              You must decide which option you will take before you add up your
              total worth.
            </em>
          </p>
        </section>
        <section>
          <h2>Jail</h2>

          <span>You land in jail when you:</span>
          <ul>
            <li>Your token lands on the space marked "Go to Jail"</li>
            <li>You draw a card marked "Go to Jail"</li>
            <li>You throw doubles three times in succession</li>
          </ul>
          <span>
            When you are sent to Jail you cannot collect your $200 salary in
            that move since, regardless of where your token is on the board, you
            must move directly into Jail. Your turn ends when you are sent to
            Jail. If you are not "sent to jail" but in the ordinary course of
            play lands on that space, you are "Just Visiting", you incur no
            penalty, and you move ahead in the usual manner on your next turn.
            You still are able to collect rent on your properties because you
            are "Just Visiting".
          </span>

          <span>A player gets out of jail by:</span>
          <ul>
            <li>
              Throwing doubles on any of your next three turns, if you succeed
              in doing this you immediately move forward the number of spaces
              shown by your doubles throw. Even though you had thrown doubles,
              you do not take another turn.
            </li>
            <li>Using the "Get Out of Jail Free Card".</li>
            <li>
              Purchasing the "Get Out of Jail Free Card" from another player and
              playing it.
            </li>
            <li>
              Paying a fine of $50 before you roll the dice on either of your
              next two turns. If you do not throw doubles by your third turn,
              you must pay the $50 fine. You then get out of Jail and
              immediately move forward the number of spaces shown by your throw.
            </li>
          </ul>

          <p>
            <em>
              Even though you are in Jail, you may buy and sell property, buy
              and sell houses and hotels, and collect rents.
            </em>
          </p>
        </section>
        <section>
          <h2>Free Parking</h2>
          <p>
            A player landing on this place does not receive any money, property
            or reward of any kind. This is just a "free" resting-place.
          </p>
          <p>
            <strong>
              This app includes a feature that assists in playing with the
              popular rule of utilizing Free Parking as pot of money collected
              from taxes/fees/etc. If enabled, there will be a second account
              managed by The Banker which players can see and deposit money
              into.
            </strong>
          </p>
        </section>
        <section>
          <h2>Houses</h2>
          <p>
            When a player owns all the properties in a colour-group they may buy
            houses from the Bank and erect them on those properties. If you buy
            one house, you may put it on any one of those properties. The next
            house you buy must be erected on one of the unimproved properties of
            this or any other complete colour-group you may own. The price you
            must pay the Bank for each house is shown on your Title Deed card
            for the property on which you erect the house. The owner still
            collects double rent from an opponent who lands on the unimproved
            properties of there complete colour-group. Following the above
            rules, you may buy and erect at any time as many houses as your
            judgement and financial standing will allow. But you must build
            evenly, i.e., you cannot erect more than one house on any one
            property of any colour-group until you have built one house on every
            property of that group. You may then begin on the second row of
            houses, and so on, up to a limit of four houses to a property. For
            example, you cannot build three Houses on one property if you have
            only one house on another property of that group. As you build
            evenly, you must also break down evenly if you sell houses back to
            the Bank (see SELLING PROPERTY).
          </p>
        </section>
        <section>
          <h2>Hotels</h2>
          <p>
            When a player has four houses on each property of a complete
            colour-group, they may buy a hotel from the Bank and erect it on any
            property of the colour-group. They return the four houses from that
            property to the Bank and pay the price for the hotel as shown on the
            Title Deed card. Only one hotel may be erected on any one property.
          </p>
        </section>
        <section>
          <h2>Building Shortages</h2>
          <p>
            When the Bank has no houses to sell, players wishing to build must
            wait for some player to return or sell their houses to the Bank
            before building. If there are a limited number of houses and hotels
            available and two or more players wish to buy more than the Bank
            has, the houses or hotels must be sold at auction to the highest
            bidder.
          </p>
        </section>
        <section>
          <h2>Selling Property</h2>
          <p>
            Unimproved properties, railroads and utilities (but not buildings)
            may be sold to any player as a private transaction for any amount
            the owner can get. However, no property can be sold to another
            player if buildings are standing on any properties of that
            colour-group. Any buildings so located must be sold back to the Bank
            before the owner can sell any property of that colour-group.
          </p>
          <p>
            Houses and Hotels may be sold back to the Bank at any time for
            one-half the price paid for them. All houses on one colour-group may
            be sold at once, or they may be sold one house at a time (one hotel
            equals five houses), evenly, in reverse of the manner in which they
            were erected.
          </p>
        </section>
        <section>
          <h2>Mortgages</h2>
          <p>
            Unimproved properties can be mortgaged through the Bank at any time.
            Before an improved property can be mortgaged, all the buildings on
            all the properties of its colour-group must be sold back to the Bank
            at half price. The mortgage value is printed on each Title Deed
            card.
          </p>
          <p>
            No rent can be collected on mortgaged properties or utilities, but
            rent can be collected on unmortgaged properties in the same group.
          </p>
          <p>
            In order to lift the mortgage, the owner must pay the Bank the
            amount of mortgage plus 10% interest. When all the properties of a
            colour-group are no longer mortgaged, the owner may begin to buy
            back houses at full price.
          </p>
          <p>
            The player who mortgages property retains possession of it and no
            other player may secure it by lifting the mortgage from the Bank.
            However, the owner may sell this mortgaged property to another
            player at any agreed price. If you are the new owner, you may lift
            the mortgage at once if you wish by paying off the mortgage plus 10%
            interest to the Bank. If the mortgage is not lifted at once, you
            must pay the Bank 10% interest when you buy the property and if you
            lift the mortgage later you must pay the Bank an additional 10%
            interest as well as the amount of the mortgage.
          </p>
        </section>
        <section>
          <h2>Bankruptcy</h2>
          <p>
            You are declared bankrupt if you owe more than you can pay either to
            another player or to the Bank. If your debt is to another player,
            you must turn over to that player all that you have of value and
            retire from the game. In making this settlement, if you own houses
            or hotels, you must return these to the Bank in exchange for money
            to the extent of one-half the amount paid for them. This cash is
            given to the creditor. If you have mortgaged property you also turn
            this property over to your creditor but the new owner must at once
            pay the Bank the amount of interest on the loan, which is 10% of the
            value of the property. The new owner who does this may then, at
            their option, pay the principal or hold the property until some
            later turn, then lift the mortgage. If they hold property in this
            way until a later turn, they must pay the interest again upon
            lifting the mortgage. Should you owe the Bank, instead of another
            player, more than you can pay (because of taxes or penalties) even
            by selling off buildings and mortgaging property, you must turn over
            all assets to the Bank. In this case, the Bank immediately sells by
            auction all property so taken, except buildings. A bankrupt player
            must immediately retire from the game. The last player left in the
            game wins.
          </p>
        </section>
        <section>
          <h2>Miscellaneous</h2>
          <p>
            Money can be loaned to a player only by the Bank and then only by
            mortgaging property. No player may borrow from or lend money to
            another player.
          </p>
          <p>
            Rules for a Short Game
            <br />
            <small>(60 - 90 minutes)</small>
          </p>

          <span>There are five changed rules for a short game:</span>
          <ol>
            <li>
              During preparation, the Banker shuffles then deals three Title
              Deed cards to each player. These are free; no payment to the Bank
              is required.
            </li>
            <li>
              You need only three houses (instead of four) on each lot of a
              complete color-group before you may buy a hotel. Hotel rent
              remains the same. The turn-in value is still one-half the purchase
              price, which in this game is one house less than in the regular
              game.
            </li>
            <li>
              If you land in Jail you must exit on your next turn by 1) using a
              “Get Out of Jail Free” card if you have (or can buy) one; or 2)
              rolling doubles; or 3) paying $50. Unlike the standard rules, you
              may try to roll doubles and, failing to do so, pay the $50 on the
              same turn.
            </li>
            <li>The penalty for landing on “Income Tax” is a flat $200.</li>
            <li>
              END OF GAME: The game ends when one player goes bankrupt. The
              remaining players value their property: (1) cash on hand; (2)
              lots, utilities and railroads owned, at the price printed on the
              board; (3) any mortgaged property owned, at one-half the price
              printed on the board; (4) houses, valued at purchase price; (5)
              hotels, valued at purchase price including the value of the three
              houses turned in.
            </li>
          </ol>
        </section>
        <section>
          <h2>The richest player wins!</h2>
        </section>
      </RulesBox>
    </ScrollLayer>
  );

  return [openHandler, rendered];
}
