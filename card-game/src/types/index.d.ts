// This file defines TypeScript types and interfaces for the card objects and player actions.

interface Card {
    name: string;
    power: number;
    imageUrl: string;
}

interface Player {
    id: string;
    name: string;
    cards: Card[];
}

interface Game {
    players: Player[];
    deck: Card[];
    currentPlayerIndex: number;
    winner?: Player;
}

interface GameActions {
    createRoom(roomId: string): void;
    joinRoom(roomId: string): void;
    drawCards(playerId: string): Card[];
    placeCard(playerId: string, card: Card): void;
    determineWinner(): Player | undefined;
}