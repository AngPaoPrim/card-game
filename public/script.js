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

// กำหนด min/max สำหรับสุ่ม power
const allCards = [
  { name: "Skibidi Toilet King", min: 80, max: 100, img: "cards/1.png" },
  { name: "Titan Cameraman", min: 80, max: 95, img: "cards/2.png" },
  { name: "TV Man", min: 75, max: 88, img: "cards/3.png" },
  { name: "Speaker Man", min: 73, max: 83, img: "cards/4.png" },
  { name: "Titan Camerawoman", min: 80, max: 90, img: "cards/5.png" },
  { name: "Skibidi Spider Toilet", min: 87, max: 90, img: "cards/6.png" },
  { name: "Ice Skibidi", min: 70, max: 80, img: "cards/7.png" },
  { name: "Skibidi Cat", min: 68, max: 70, img: "cards/8.png" },
  { name: "Doctor Skibidi", min: 60, max: 75, img: "cards/9.png" },
  { name: "Skibidi Joker", min: 73, max: 79, img: "cards/10.png" },
  { name: "Fire Skibidi", min: 69, max: 75, img: "cards/11.png" },
  { name: "Golden Skibidi", min: 92, max: 99, img: "cards/12.png" },
  { name: "Steel Skibidi", min: 80, max: 85, img: "cards/13.png" },
  { name: "Water Skibidi", min: 71, max: 71, img: "cards/14.png" },
  { name: "Hero Cameraman", min: 65, max: 75, img: "cards/15.png" },
  { name: "Magic Kicker Skibidi", min: 77, max: 80, img: "cards/16.png" },
  { name: "Skibidi Elephant", min: 85, max: 85, img: "cards/17.png" },
  { name: "Sea Skibidi", min: 66, max: 66, img: "cards/18.png" },
  { name: "Vampire Skibidi", min: 84, max: 84, img: "cards/19.png" },
  { name: "Lava Zombie Skibidi", min: 79, max: 79, img: "cards/20.png" },
];

// สุ่มการ์ด 5 ใบ โดยแต่ละใบสุ่ม power ตาม min/max
function getRandomCards() {
  const shuffled = [...allCards].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 5).map(card => ({
    ...card,
    power: card.min === card.max
      ? card.min
      : Math.floor(Math.random() * (card.max - card.min + 1)) + card.min
  }));
}

// ลบ table/roundN ก่อนแจกไพ่ใหม่ทุกครั้ง
function resetTable(roomId, round) {
  return db.ref(`rooms/${roomId}/table/round${round}`).remove();
}

let playerId = null;
let myCards = [];
let selectedCardIndex = null;
let roomId = "";
let playerName = "";
let currentRound = 1;
let roundListener = null;
let playersListener = null;
let gameStateListener = null;
let scores = {};
let tableRevealed = false;
let isHost = false;
let isGameActive = false;

function selectCard(index) {
  selectedCardIndex = index;
  document.querySelectorAll(".card").forEach((el, i) => {
    el.classList.toggle("selected", i === index);
  });
}

function showCards(cards) {
  if (!cards || cards.length === 0) return;
  
  selectedCardIndex = null;
  myCards = cards;
  const cardDiv = document.getElementById("player-hand");
  if (!cardDiv) return;
  
  cardDiv.innerHTML = "";
  cards.forEach((card, index) => {
    const div = document.createElement("div");
    div.className = "card";
    div.onclick = () => selectCard(index);
    div.innerHTML = `
      <img src="${card.img}" alt="${card.name}" onerror="this.style.display='none'">
      <strong>${card.name}</strong><br>พลัง: ${card.power}
    `;
    cardDiv.appendChild(div);
  });
}

function renderBattleSlots(players) {
  const battlefield = document.getElementById("battlefield");
  if (!battlefield) return;
  
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
  if (!playerListDiv) return;
  
  const names = Object.values(players).map(p => p.name || "-");
  playerListDiv.innerHTML = `<b>ผู้เล่น (${names.length} คน)</b><br>${names.map((n, i) => (i+1)+". "+n).join("<br>")}`;
}

function updateRoundInfo(round) {
  const roundDiv = document.getElementById("round-info");
  if (!roundDiv) return;
  
  roundDiv.innerHTML = `<b>รอบที่ ${round} / 5</b>`;
}

// แจกไพ่ใหม่เฉพาะ host (player1) เท่านั้น
function dealNewCardsToAll(roomId, players) {
  if (!isHost) return;
  
  const updates = {};
  Object.keys(players).forEach(pid => {
    const newCards = getRandomCards();
    updates[`rooms/${roomId}/players/${pid}/cards`] = newCards;
  });
  
  return db.ref().update(updates);
}

function playCard() {
  if (selectedCardIndex === null) {
    alert("กรุณาเลือกการ์ดก่อนวาง!");
    return;
  }
  
  if (!myCards[selectedCardIndex]) {
    alert("ไม่พบการ์ดที่เลือก!");
    return;
  }

  const cardToPlay = myCards[selectedCardIndex];
  const roundPath = `rooms/${roomId}/table/round${currentRound}/${playerId}`;
  
  db.ref(roundPath).set({
    ...cardToPlay,
    nameDisplay: playerName,
    timestamp: firebase.database.ServerValue.TIMESTAMP
  }).then(() => {
    // อัพเดต UI ทันที
    const slot = document.getElementById("slot-" + playerId);
    if (slot) {
      slot.innerHTML = `
        <img src="${cardToPlay.img}" alt="${cardToPlay.name}" style="width:80px;height:80px;border-radius:6px;" onerror="this.style.display='none'"><br>
        <strong>${cardToPlay.name}</strong><br>พลัง: ${cardToPlay.power}
      `;
    }
    
    // ซ่อนปุ่มวางการ์ด
    const playBtn = document.getElementById("play-card-btn");
    if (playBtn) playBtn.remove();
    
    alert(`วางการ์ด ${cardToPlay.name} แล้ว รอผู้เล่นคนอื่น...`);
    selectedCardIndex = null;
  }).catch(error => {
    console.error("Error playing card:", error);
    alert("เกิดข้อผิดพลาดในการวางการ์ด");
  });
}

function cleanupListeners() {
  if (roundListener) {
    roundListener.off();
    roundListener = null;
  }
  if (playersListener) {
    playersListener.off();
    playersListener = null;
  }
  if (gameStateListener) {
    gameStateListener.off();
    gameStateListener = null;
  }
}

function calculateWinner(tableData) {
  let maxPower = -Infinity;
  let winners = [];
  
  Object.entries(tableData).forEach(([pid, card]) => {
    if (card.power > maxPower) {
      maxPower = card.power;
      winners = [pid];
    } else if (card.power === maxPower) {
      winners.push(pid);
    }
  });
  
  return { winners, maxPower };
}

function updateScores(winners, players) {
  if (currentRound === 1) {
    scores = {};
    Object.keys(players).forEach(pid => {
      scores[pid] = 0;
    });
  }
  
  winners.forEach(pid => {
    if (scores[pid] !== undefined) {
      scores[pid] += 1;
    }
  });
}

function showRoundResults(tableData, players, winners) {
  const resultsText = "รอบ " + currentRound + ":\n" +
    Object.entries(tableData).map(([pid, card]) => {
      const pname = players[pid]?.name || pid;
      return `${pname}: ${card.name} (${card.power})`;
    }).join("\n") +
    "\n➡️ ผู้ชนะรอบนี้: " + (winners.length === 1 ? (players[winners[0]]?.name || winners[0]) : "เสมอกัน");
  
  alert(resultsText);
}

function showFinalResults(players) {
  const maxScore = Math.max(...Object.values(scores));
  const topPlayers = Object.entries(scores)
    .filter(([_, sc]) => sc === maxScore)
    .map(([pid]) => players[pid]?.name || pid);

  const finalText = "จบเกม!\n\nคะแนนรวม:\n" +
    Object.entries(scores).map(([pid, sc]) => {
      const pname = players[pid]?.name || pid;
      return `${pname}: ${sc} คะแนน`;
    }).join("\n") +
    "\n\nผู้ชนะ: " + (topPlayers.length === 1 ? topPlayers[0] : "เสมอกัน");
  
  alert(finalText);
}

function addGameActions() {
  let actionsDiv = document.getElementById("game-actions");
  if (!actionsDiv) {
    actionsDiv = document.createElement("div");
    actionsDiv.id = "game-actions";
    actionsDiv.style.margin = "20px";
    document.body.appendChild(actionsDiv);
  }
  
  actionsDiv.innerHTML = `
    <button id="play-again-btn">เล่นใหม่</button>
    <button id="exit-btn">ออก</button>
  `;
  
  document.getElementById("play-again-btn").onclick = () => {
    if (isHost) {
      actionsDiv.innerHTML = "";
      scores = {};
      db.ref(`rooms/${roomId}/currentRound`).set(1).then(() => {
        return resetTable(roomId, 1);
      }).then(() => {
        return db.ref(`rooms/${roomId}/players`).once('value');
      }).then(snapshot => {
        const players = snapshot.val() || {};
        return dealNewCardsToAll(roomId, players);
      }).catch(error => {
        console.error("Error restarting game:", error);
      });
    }
  };
  
  document.getElementById("exit-btn").onclick = () => {
    cleanupListeners();
    // ลบผู้เล่นออกจากห้อง
    if (playerId && roomId) {
      db.ref(`rooms/${roomId}/players/${playerId}`).remove();
    }
    location.reload();
  };
}

function listenForBattle(roomIdParam) {
  if (!roomIdParam) return;
  
  cleanupListeners(); // เคลียร์ listener เก่าก่อน
  isGameActive = true;
  
  // Listen to players
  playersListener = db.ref(`rooms/${roomIdParam}/players`);
  playersListener.on('value', (snap) => {
    const players = snap.val() || {};
    updatePlayerList(players);
    renderBattleSlots(players);
    
    // Check if we're still in the game
    if (!players[playerId]) {
      alert("คุณถูกตัดการเชื่อมต่อจากห้อง");
      cleanupListeners();
      location.reload();
      return;
    }
    
    // Listen to current round
    if (gameStateListener) gameStateListener.off();
    gameStateListener = db.ref(`rooms/${roomIdParam}/currentRound`);
    gameStateListener.on('value', (roundSnap) => {
      const round = roundSnap.val() || 1;
      currentRound = round;
      updateRoundInfo(currentRound);
      
      isHost = playerId === "player1";
      tableRevealed = false;
      
      // Listen to table for current round
      if (roundListener) roundListener.off();
      roundListener = db.ref(`rooms/${roomIdParam}/table/round${currentRound}`);
      roundListener.on('value', (snapshot) => {
        const tableData = snapshot.val() || {};
        
        // แสดงการ์ดที่วางแล้ว
        Object.entries(players).forEach(([pid, pdata]) => {
          const slot = document.getElementById("slot-" + pid);
          if (!slot) return;
          
          if (pid === playerId) {
            // แสดงการ์ดของตัวเองเสมอ
            if (tableData[pid]) {
              slot.innerHTML = `
                <img src="${tableData[pid].img}" alt="${tableData[pid].name}" style="width:80px;height:80px;border-radius:6px;" onerror="this.style.display='none'"><br>
                <strong>${tableData[pid].name}</strong><br>พลัง: ${tableData[pid].power}
              `;
            } else {
              slot.innerHTML = pdata.name || pid;
            }
          } else {
            // แสดงการ์ดของคนอื่นเฉพาะเมื่อเปิดแล้ว
            if (tableData[pid] && tableRevealed) {
              slot.innerHTML = `
                <img src="${tableData[pid].img}" alt="${tableData[pid].name}" style="width:80px;height:80px;border-radius:6px;" onerror="this.style.display='none'"><br>
                <strong>${tableData[pid].name}</strong><br>พลัง: ${tableData[pid].power}
              `;
            } else {
              slot.innerHTML = tableData[pid] ? "🎴 วางการ์ดแล้ว" : (pdata.name || pid);
            }
          }
        });
        
        // จัดการการแสดงการ์ดในมือ
        if (players[playerId] && players[playerId].cards) {
          const cardDiv = document.getElementById("player-hand");
          if (!cardDiv) return;
          
          if (!tableData[playerId]) {
            // ยังไม่ได้วางการ์ด - แสดงการ์ดและปุ่ม
            showCards(players[playerId].cards);
            
            // เพิ่มปุ่มวางการ์ดถ้ายังไม่มี
            if (!document.getElementById("play-card-btn")) {
              const playBtn = document.createElement("button");
              playBtn.id = "play-card-btn";
              playBtn.innerText = "วางการ์ดในรอบนี้";
              playBtn.onclick = () => playCard();
              cardDiv.appendChild(document.createElement("br"));
              cardDiv.appendChild(playBtn);
            }
          } else {
            // วางการ์ดแล้ว - แสดงการ์ดเฉยๆ
            myCards = players[playerId].cards;
            cardDiv.innerHTML = "";
            myCards.forEach((card, index) => {
              const div = document.createElement("div");
              div.className = "card";
              div.innerHTML = `
                <img src="${card.img}" alt="${card.name}" onerror="this.style.display='none'">
                <strong>${card.name}</strong><br>พลัง: ${card.power}
              `;
              cardDiv.appendChild(div);
            });
          }
        }
        
        // เมื่อทุกคนวางครบ
        const playerCount = Object.keys(players).length;
        const cardsPlayed = Object.keys(tableData).length;
        
        if (cardsPlayed === playerCount && playerCount > 0 && !tableRevealed) {
          tableRevealed = true;
          
          setTimeout(() => {
            // แสดงการ์ดทุกคน
            Object.entries(players).forEach(([pid, pdata]) => {
              const card = tableData[pid];
              const slot = document.getElementById("slot-" + pid);
              if (slot && card) {
                slot.innerHTML = `
                  <img src="${card.img}" alt="${card.name}" style="width:80px;height:80px;border-radius:6px;" onerror="this.style.display='none'"><br>
                  <strong>${card.name}</strong><br>พลัง: ${card.power}
                `;
              }
            });
            
            // คำนวณผลลัพธ์
            const { winners } = calculateWinner(tableData);
            updateScores(winners, players);
            
            setTimeout(() => {
              showRoundResults(tableData, players, winners);
              renderBattleSlots(players);
              
              if (currentRound >= 5) {
                // จบเกม
                showFinalResults(players);
                addGameActions();
              } else {
                // ไปรอบต่อไป
                if (isHost) {
                  db.ref(`rooms/${roomIdParam}/currentRound`).set(currentRound + 1).then(() => {
                    return resetTable(roomIdParam, currentRound + 1);
                  }).then(() => {
                    return dealNewCardsToAll(roomIdParam, players);
                  }).catch(error => {
                    console.error("Error advancing round:", error);
                  });
                }
              }
            }, 3000);
          }, 2000);
        }
      });
    });
  });
}

// สร้างห้อง (คนแรก)
window.createRoom = function () {
  const roomIdInput = document.getElementById("room-id");
  const playerNameInput = document.getElementById("player-name");
  
  if (!roomIdInput || !playerNameInput) {
    alert("ไม่พบ input elements");
    return;
  }
  
  roomId = roomIdInput.value.trim();
  playerName = playerNameInput.value.trim() || "Player";
  
  if (!roomId) {
    alert("กรุณากรอกรหัสห้อง");
    return;
  }
  
  // ตรวจสอบว่าห้องมีอยู่แล้วหรือไม่
  db.ref("rooms/" + roomId).once("value").then(snapshot => {
    if (snapshot.exists()) {
      alert("ห้องนี้มีอยู่แล้ว กรุณาใช้รหัสห้องอื่น");
      return;
    }
    
    const cards = getRandomCards();
    playerId = "player1";
    isHost = true;
    
    return db.ref("rooms/" + roomId).set({
      players: {
        [playerId]: { cards: cards, name: playerName }
      },
      currentRound: 1,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
  }).then(() => {
    if (isHost) {
      listenForBattle(roomId);
      alert("สร้างห้องสำเร็จ รอเพื่อนเข้าร่วม");
    }
  }).catch(error => {
    console.error("Error creating room:", error);
    alert("เกิดข้อผิดพลาดในการสร้างห้อง");
  });
};

// เข้าห้อง (คนถัดไป)
window.joinRoom = function () {
  const roomIdInput = document.getElementById("room-id");
  const playerNameInput = document.getElementById("player-name");
  
  if (!roomIdInput || !playerNameInput) {
    alert("ไม่พบ input elements");
    return;
  }
  
  roomId = roomIdInput.value.trim();
  playerName = playerNameInput.value.trim() || "Player";
  
  if (!roomId) {
    alert("กรุณากรอกรหัสห้อง");
    return;
  }
  
  db.ref("rooms/" + roomId + "/players").once("value").then(snapshot => {
    const players = snapshot.val();
    
    if (!players) {
      alert("ไม่พบห้องนี้");
      return;
    }
    
    const playerCount = Object.keys(players).length;
    if (playerCount >= 6) {
      alert("ห้องเต็มแล้ว (สูงสุด 6 คน)");
      return;
    }
    
    const num = playerCount + 1;
    playerId = "player" + num;
    isHost = false;
    const cards = getRandomCards();
    
    return db.ref("rooms/" + roomId + "/players/" + playerId).set({
      cards: cards,
      name: playerName,
      joinedAt: firebase.database.ServerValue.TIMESTAMP
    });
  }).then(() => {
    listenForBattle(roomId);
    alert("เข้าห้องสำเร็จ! คุณคือ " + playerName);
  }).catch(error => {
    console.error("Error joining room:", error);
    alert("เกิดข้อผิดพลาดในการเข้าห้อง");
  });
};

// Cleanup เมื่อปิดหน้าต่าง
window.addEventListener('beforeunload', () => {
  cleanupListeners();
  if (playerId && roomId) {
    db.ref(`rooms/${roomId}/players/${playerId}`).remove();
  }
});