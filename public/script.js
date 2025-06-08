// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCDLjcitmrqHO-3Wf_pT7lbdk3Kh_MWTpk",
  authDomain: "computer-booking-e6341.firebaseapp.com",
  databaseURL: "https://computer-booking-e6341-default-rtdb.firebaseio.com",
  projectId: "computer-booking-e6341",
  storageBucket: "computer-booking-e6341.appspot.com",
  messagingSenderId: "223463040793",
  appId: "1:223463040793:web:cb49a2b3233472c8a08788",
  measurementId: "G-M5N1RLBEC7"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const allCards = [
  { name: "Skibidi Toilet King", power: 100, img: "/public/cards/1.png" },
  { name: "Titan Cameraman", power: 95, img: "/public/cards/2.png" },
  { name: "TV Man", power: 88, img: "/public/cards/3.png" },
  { name: "Speaker Man", power: 83, img: "/public/cards/4.png" },
  { name: "Titan Camerawoman", power: 90, img: "/public/cards/5.png" },
  { name: "Skibidi Spider Toilet", power: 87, img: "/public/cards/6.png" },
  { name: "Ice Skibidi", power: 70, img: "/public/cards/7.png" },
  { name: "Skibidi Cat", power: 68, img: "/public/cards/8.png" },
  { name: "Doctor Skibidi", power: 75, img: "/public/cards/9.png" },
  { name: "Skibidi Joker", power: 73, img: "/public/cards/10.png" },
  { name: "Fire Skibidi", power: 69, img: "/public/cards/11.png" },
  { name: "Golden Skibidi", power: 92, img: "/public/cards/12.png" },
  { name: "Steel Skibidi", power: 80, img: "/public/cards/13.png" },
  { name: "Water Skibidi", power: 71, img: "/public/cards/14.png" },
  { name: "Hero Cameraman", power: 89, img: "/public/cards/15.png" },
  { name: "Magic Kicker Skibidi", power: 77, img: "/public/cards/16.png" },
  { name: "Skibidi Elephant", power: 85, img: "/public/cards/17.png" },
  { name: "Sea Skibidi", power: 66, img: "/public/cards/18.png" },
  { name: "Vampire Skibidi", power: 84, img: "/public/cards/19.png" },
  { name: "Lava Zombie Skibidi", power: 79, img: "/public/cards/20.png" },
];


function getRandomCards() {
  const shuffled = [...allCards].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5);
}

let playerId = null;
let myCards = [];
let selectedCardIndex = null;
let roomId = "";
let playerName = "";
let currentRound = 1;
let roundListener = null;

function selectCard(index) {
  selectedCardIndex = index;
  document.querySelectorAll(".card").forEach((el, i) => {
    el.classList.toggle("selected", i === index);
  });
}

function showCards(cards) {
  myCards = cards;
  const cardDiv = document.getElementById("player-hand");
  cardDiv.innerHTML = "";
  cards.forEach((card, index) => {
    const div = document.createElement("div");
    div.className = "card";
    div.onclick = () => selectCard(index);
    div.innerHTML = `
      <img src="${card.img}" alt="${card.name}">
      <strong>${card.name}</strong><br>พลัง: ${card.power}
    `;
    cardDiv.appendChild(div);
  });

  const playBtn = document.createElement("button");
  playBtn.innerText = "วางการ์ดในรอบนี้";
  playBtn.onclick = () => playCard();
  cardDiv.appendChild(document.createElement("br"));
  cardDiv.appendChild(playBtn);
}

function renderBattleSlots(players) {
  const battlefield = document.getElementById("battlefield");
  battlefield.innerHTML = "";
  Object.entries(players).forEach(([pid, pdata]) => {
    const div = document.createElement("div");
    div.className = "battle-slot";
    div.id = "slot-" + pid;
    div.innerText = pdata.name ? pdata.name : pid;
    battlefield.appendChild(div);
  });
}

function playCard() {
  if (selectedCardIndex === null) {
    alert("กรุณาเลือกการ์ดก่อนวาง!");
    return;
  }
  const card = myCards[selectedCardIndex];
  db.ref(`rooms/${roomId}/currentRound`).once("value").then(roundSnap => {
    const round = roundSnap.val() || 1;
    const roundPath = `rooms/${roomId}/table/round${round}/${playerId}`;
    const updates = {};
    updates[roundPath] = { ...card, nameDisplay: playerName };
    db.ref().update(updates);

    document.getElementById("slot-" + playerId).innerHTML = `
      <img src="${card.img}" alt="${card.name}" style="width:80px;height:80px;border-radius:6px;"><br>
      <strong>${card.name}</strong><br>พลัง: ${card.power}
    `;

    alert(`วางการ์ด ${card.name} แล้ว รอผู้เล่นคนอื่น...`);
    selectedCardIndex = null;
  });
}

function listenForBattle(roomIdParam) {
  db.ref(`rooms/${roomIdParam}/players`).on('value', (snap) => {
    const players = snap.val() || {};
    renderBattleSlots(players);

    // ฟัง currentRound จาก database
    db.ref(`rooms/${roomIdParam}/currentRound`).on('value', (roundSnap) => {
      const round = roundSnap.val() || 1;
      currentRound = round;

      // ถ้ามี listener เก่า ให้ปิดก่อน
      if (roundListener) roundListener.off();

      // ฟังรอบปัจจุบัน
      roundListener = db.ref(`rooms/${roomIdParam}/table/round${currentRound}`);
      roundListener.on('value', (snapshot) => {
        const tableData = snapshot.val() || {};
        Object.entries(tableData).forEach(([pid, card]) => {
          document.getElementById("slot-" + pid).innerHTML = `
            <img src="${card.img}" alt="${card.name}" style="width:80px;height:80px;border-radius:6px;"><br>
            <strong>${card.name}</strong><br>พลัง: ${card.power}
          `;
        });
        if (
          Object.keys(tableData).length === Object.keys(players).length &&
          Object.keys(players).length > 0
        ) {
          let max = -Infinity, winner = [];
          Object.entries(tableData).forEach(([pid, card]) => {
            if (card.power > max) {
              max = card.power;
              winner = [pid];
            } else if (card.power === max) {
              winner.push(pid);
            }
          });
          setTimeout(() => {
            alert(
              "รอบ " + currentRound + ":\n" +
              Object.entries(tableData).map(([pid, card]) => {
                const pname = players[pid]?.name || pid;
                return `${pname}: ${card.name} (${card.power})`;
              }).join("\n") +
              "\n➡️ ผู้ชนะ: " + (winner.length === 1 ? (players[winner[0]]?.name || winner[0]) : "เสมอกัน")
            );
            // อัปเดตรอบใน database (ให้ client ทุกคน sync)
            db.ref(`rooms/${roomIdParam}/currentRound`).set(currentRound + 1);
          }, 500);
        }
      });
    });
  });
}

// สร้างห้อง (คนแรก)
window.createRoom = function () {
  roomId = document.getElementById("room-id").value.trim();
  playerName = document.getElementById("player-name").value.trim() || "Player";
  if (!roomId) {
    alert("กรุณากรอกรหัสห้อง");
    return;
  }
  const cards = getRandomCards();
  playerId = "player1";
  db.ref("rooms/" + roomId).set({
    players: {
      [playerId]: { cards: cards, name: playerName }
    },
    currentRound: 1
  }).then(() => {
    showCards(cards);
    listenForBattle(roomId);
    alert("สร้างห้องสำเร็จ รอเพื่อนเข้าร่วม");
  });
};

// เข้าห้อง (คนถัดไป)
window.joinRoom = function () {
  roomId = document.getElementById("room-id").value.trim();
  playerName = document.getElementById("player-name").value.trim() || "Player";
  if (!roomId) {
    alert("กรุณากรอกรหัสห้อง");
    return;
  }
  db.ref("rooms/" + roomId + "/players").once("value").then(snapshot => {
    const players = snapshot.val() || {};
    const num = Object.keys(players).length + 1;
    playerId = "player" + num;
    const cards = getRandomCards();
    db.ref("rooms/" + roomId + "/players/" + playerId).set({
      cards: cards,
      name: playerName
    }).then(() => {
      showCards(cards);
      listenForBattle(roomId);
      alert("เข้าห้องสำเร็จ! คุณคือ " + playerName);
    });
  });
};
function updatePlayerList(players) {
  const playerListDiv = document.getElementById("player-list");
  const names = Object.values(players).map(p => p.name || "-");
  playerListDiv.innerHTML = `<b>ผู้เล่น (${names.length} คน)</b><br>${names.map((n, i) => (i+1)+". "+n).join("<br>")}`;
}

function listenForBattle(roomIdParam) {
  db.ref(`rooms/${roomIdParam}/players`).on('value', (snap) => {
    const players = snap.val() || {};
    updatePlayerList(players); // <--- เพิ่มตรงนี้
    renderBattleSlots(players);
    // ...existing code...
  });
}