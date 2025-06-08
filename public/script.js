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
  { name: "Skibidi Toilet King", power: 100, img: "cards/1.png" },
  { name: "Titan Cameraman", power: 95, img: "cards/2.png" },
  { name: "TV Man", power: 88, img: "cards/3.png" },
  { name: "Speaker Man", power: 83, img: "cards/4.png" },
  { name: "Titan Camerawoman", power: 90, img: "cards/5.png" },
  { name: "Skibidi Spider Toilet", power: 87, img: "cards/6.png" },
  { name: "Ice Skibidi", power: 70, img: "cards/7.png" },
  { name: "Skibidi Cat", power: 68, img: "cards/8.png" },
  { name: "Doctor Skibidi", power: 75, img: "cards/9.png" },
  { name: "Skibidi Joker", power: 73, img: "cards/10.png" },
  { name: "Fire Skibidi", power: 69, img: "cards/11.png" },
  { name: "Golden Skibidi", power: 92, img: "cards/12.png" },
  { name: "Steel Skibidi", power: 80, img: "cards/13.png" },
  { name: "Water Skibidi", power: 71, img: "cards/14.png" },
  { name: "Hero Cameraman", power: 89, img: "cards/15.png" },
  { name: "Magic Kicker Skibidi", power: 77, img: "cards/16.png" },
  { name: "Skibidi Elephant", power: 85, img: "cards/17.png" },
  { name: "Sea Skibidi", power: 66, img: "cards/18.png" },
  { name: "Vampire Skibidi", power: 84, img: "cards/19.png" },
  { name: "Lava Zombie Skibidi", power: 79, img: "cards/20.png" },
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
let scores = {};
let tableRevealed = false;
let isHost = false;

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

function updatePlayerList(players) {
  const playerListDiv = document.getElementById("player-list");
  const names = Object.values(players).map(p => p.name || "-");
  playerListDiv.innerHTML = `<b>ผู้เล่น (${names.length} คน)</b><br>${names.map((n, i) => (i+1)+". "+n).join("<br>")}`;
}

function updateRoundInfo(currentRound) {
  const roundDiv = document.getElementById("round-info");
  roundDiv.innerHTML = `<b>รอบที่ ${currentRound} / 5</b>`;
}

// แจกไพ่ใหม่เฉพาะ host (player1) เท่านั้น
function dealNewCardsToAll(roomId, players) {
  if (!isHost) return;
  Object.keys(players).forEach(pid => {
    const newCards = getRandomCards();
    db.ref(`rooms/${roomId}/players/${pid}/cards`).set(newCards);
  });
}

function playCard() {
  if (selectedCardIndex === null) {
    alert("กรุณาเลือกการ์ดก่อนวาง!");
    return;
  }
  db.ref(`rooms/${roomId}/currentRound`).once("value").then(roundSnap => {
    const round = roundSnap.val() || 1;
    const roundPath = `rooms/${roomId}/table/round${round}/${playerId}`;
    const updates = {};
    updates[roundPath] = { ...myCards[selectedCardIndex], nameDisplay: playerName };
    db.ref().update(updates);

    document.getElementById("slot-" + playerId).innerHTML = `
      <img src="${myCards[selectedCardIndex].img}" alt="${myCards[selectedCardIndex].name}" style="width:80px;height:80px;border-radius:6px;"><br>
      <strong>${myCards[selectedCardIndex].name}</strong><br>พลัง: ${myCards[selectedCardIndex].power}
    `;

    alert(`วางการ์ด ${myCards[selectedCardIndex].name} แล้ว รอผู้เล่นคนอื่น...`);
    selectedCardIndex = null;
  });
}

function listenForBattle(roomIdParam) {
  db.ref(`rooms/${roomIdParam}/players`).on('value', (snap) => {
    const players = snap.val() || {};
    updatePlayerList(players);
    renderBattleSlots(players);

    db.ref(`rooms/${roomIdParam}/currentRound`).on('value', (roundSnap) => {
      const round = roundSnap.val() || 1;
      currentRound = round;
      updateRoundInfo(currentRound);

      if (roundListener) roundListener.off();
      isHost = playerId === "player1";
      tableRevealed = false;

      roundListener = db.ref(`rooms/${roomIdParam}/table/round${currentRound}`);
      roundListener.on('value', (snapshot) => {
        const tableData = snapshot.val() || {};

        // แสดงเฉพาะไพ่ที่เราวางเอง (หรือยังไม่วาง)
        Object.entries(players).forEach(([pid, pdata]) => {
          const slot = document.getElementById("slot-" + pid);
          if (pid === playerId) {
            if (tableData[pid]) {
              slot.innerHTML = `
                <img src="${tableData[pid].img}" alt="${tableData[pid].name}" style="width:80px;height:80px;border-radius:6px;"><br>
                <strong>${tableData[pid].name}</strong><br>พลัง: ${tableData[pid].power}
              `;
            }
          } else {
            slot.innerHTML = tableData[pid] && tableRevealed
              ? `
                <img src="${tableData[pid].img}" alt="${tableData[pid].name}" style="width:80px;height:80px;border-radius:6px;"><br>
                <strong>${tableData[pid].name}</strong><br>พลัง: ${tableData[pid].power}
              `
              : (pdata.name || pid);
          }
        });

        // เมื่อทุกคนวางครบ
        if (
          Object.keys(tableData).length === Object.keys(players).length &&
          Object.keys(players).length > 0 &&
          !tableRevealed
        ) {
          tableRevealed = true;
          setTimeout(() => {
            // แสดงไพ่ทุกคน
            Object.entries(players).forEach(([pid, pdata]) => {
              const card = tableData[pid];
              const slot = document.getElementById("slot-" + pid);
              slot.innerHTML = `
                <img src="${card.img}" alt="${card.name}" style="width:80px;height:80px;border-radius:6px;"><br>
                <strong>${card.name}</strong><br>พลัง: ${card.power}
              `;
            });

            // คำนวณคะแนน
            if (currentRound === 1) scores = {};
            let max = -Infinity, winner = [];
            Object.entries(tableData).forEach(([pid, card]) => {
              if (card.power > max) {
                max = card.power;
                winner = [pid];
              } else if (card.power === max) {
                winner.push(pid);
              }
            });
            Object.keys(players).forEach(pid => {
              if (!scores[pid]) scores[pid] = 0;
              if (winner.includes(pid)) scores[pid] += 1;
            });

            setTimeout(() => {
              alert(
                "รอบ " + currentRound + ":\n" +
                Object.entries(tableData).map(([pid, card]) => {
                  const pname = players[pid]?.name || pid;
                  return `${pname}: ${card.name} (${card.power})`;
                }).join("\n") +
                "\n➡️ ผู้ชนะรอบนี้: " + (winner.length === 1 ? (players[winner[0]]?.name || winner[0]) : "เสมอกัน")
              );

              renderBattleSlots(players);

              if (currentRound >= 5) {
                let maxScore = Math.max(...Object.values(scores));
                let topPlayers = Object.entries(scores)
                  .filter(([_, sc]) => sc === maxScore)
                  .map(([pid]) => players[pid]?.name || pid);

                alert(
                  "จบเกม!\n\nคะแนนรวม:\n" +
                  Object.entries(scores).map(([pid, sc]) => {
                    const pname = players[pid]?.name || pid;
                    return `${pname}: ${sc} คะแนน`;
                  }).join("\n") +
                  "\n\nผู้ชนะ: " + (topPlayers.length === 1 ? topPlayers[0] : "เสมอกัน")
                );
                db.ref(`rooms/${roomIdParam}/currentRound`).set(1);
              } else {
                db.ref(`rooms/${roomIdParam}/currentRound`).set(currentRound + 1);
                // แจกไพ่ใหม่หลังขึ้นรอบใหม่ (เฉพาะ host)
                if (isHost) {
                  setTimeout(() => {
                    dealNewCardsToAll(roomIdParam, players);
                  }, 500);
                }
              }
            }, 3000); // delay 3 วิ
          }, 3000); // delay 3 วิ
        }
      });

      // แสดงไพ่เราเองทุกตา
      if (players[playerId] && players[playerId].cards) {
        showCards(players[playerId].cards);
      }
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
  isHost = true;
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
    isHost = false;
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