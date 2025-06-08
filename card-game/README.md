# Card Battle Game

## Overview
This project is a simple card battle game where players randomly receive 5 unique cards from a pool of 20 cards. The player with the highest power wins the game. The game includes a user interface for players to see their cards and interact with the game.

## Project Structure
```
card-game
├── src
│   ├── index.html        # HTML structure of the game
│   ├── script.js         # Main JavaScript logic for the game
│   ├── styles.css        # CSS styles for the game
│   ├── cards
│   │   └── cards.js      # Card definitions and selection logic
│   └── types
│       └── index.d.ts    # TypeScript types and interfaces
├── package.json          # npm configuration file
└── README.md             # Project documentation
```

## Setup Instructions
1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Install the necessary dependencies by running:
   ```
   npm install
   ```
4. Open `src/index.html` in your web browser to start the game.

## Game Rules
- Each player is randomly assigned 5 unique cards from a pool of 20 cards.
- Each card has a power value, and the player with the highest total power wins.
- Players can place their cards on the table to compete against each other.

## How to Play
1. Enter a room ID to create or join a game room.
2. Click on the "สร้างห้อง" (Create Room) or "เข้าห้อง" (Join Room) button.
3. Once in the game, your cards will be displayed.
4. Players can place their cards on the table to challenge each other.
5. The game will determine the winner based on the total power of the cards played.

Enjoy the game!