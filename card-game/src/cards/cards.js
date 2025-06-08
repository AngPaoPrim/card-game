const cards = [
  { name: "Card 1", power: 10, imageUrl: "images/card1.png" },
  { name: "Card 2", power: 15, imageUrl: "images/card2.png" },
  { name: "Card 3", power: 20, imageUrl: "images/card3.png" },
  { name: "Card 4", power: 25, imageUrl: "images/card4.png" },
  { name: "Card 5", power: 30, imageUrl: "images/card5.png" },
  { name: "Card 6", power: 12, imageUrl: "images/card6.png" },
  { name: "Card 7", power: 18, imageUrl: "images/card7.png" },
  { name: "Card 8", power: 22, imageUrl: "images/card8.png" },
  { name: "Card 9", power: 28, imageUrl: "images/card9.png" },
  { name: "Card 10", power: 35, imageUrl: "images/card10.png" },
  { name: "Card 11", power: 14, imageUrl: "images/card11.png" },
  { name: "Card 12", power: 19, imageUrl: "images/card12.png" },
  { name: "Card 13", power: 24, imageUrl: "images/card13.png" },
  { name: "Card 14", power: 29, imageUrl: "images/card14.png" },
  { name: "Card 15", power: 33, imageUrl: "images/card15.png" },
  { name: "Card 16", power: 11, imageUrl: "images/card16.png" },
  { name: "Card 17", power: 17, imageUrl: "images/card17.png" },
  { name: "Card 18", power: 23, imageUrl: "images/card18.png" },
  { name: "Card 19", power: 27, imageUrl: "images/card19.png" },
  { name: "Card 20", power: 32, imageUrl: "images/card20.png" },
];

function getRandomCards(numCards) {
  const shuffledCards = cards.sort(() => 0.5 - Math.random());
  return shuffledCards.slice(0, numCards);
}

export { cards, getRandomCards };