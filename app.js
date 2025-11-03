let mode = "";
let difficulty = "easy";
let playerChar = "X";
let aiChar = "O";
let board = Array(9).fill("");
let currentPlayer = "X";
let gameActive = true;

const boardDiv = document.getElementById("board");
const statusDiv = document.getElementById("status");

// Screen navigation
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

function setMode(selectedMode) {
  mode = selectedMode;
  if (mode === "ai") showScreen("difficultySelect");
  else { showScreen("gameScreen"); startGame(); }
}

function setDifficulty(diff) {
  difficulty = diff;
  showScreen("charSelect");
}

function setChar(char) {
  playerChar = char;
  aiChar = char === "X" ? "O" : "X";
  showScreen("gameScreen");
  startGame();

  if (aiChar === "X") {
    currentPlayer = aiChar;
    setTimeout(() => { aiMove(); }, 600);
  } else currentPlayer = playerChar;
}

function goBack(from) {
  if (from === "difficultySelect") showScreen("modeSelect");
  if (from === "charSelect") mode === "ai" ? showScreen("difficultySelect") : showScreen("modeSelect");
}

function backToMenu() {
  board = Array(9).fill("");
  gameActive = true;
  document.querySelectorAll(".cell").forEach(c => c.remove());
  showScreen("modeSelect");
}

// Game setup
function startGame() {
  boardDiv.innerHTML = "";
  board = Array(9).fill("");
  gameActive = true;
  statusDiv.textContent = "";
  currentPlayer = "X";

  for (let i = 0; i < 9; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell", "fade-in");
    cell.addEventListener("click", () => handleClick(i));
    boardDiv.appendChild(cell);
  }
}

// Player move
function handleClick(i) {
  if (!gameActive || board[i] !== "") return;
  if (mode === "ai" && currentPlayer !== playerChar) return;

  board[i] = currentPlayer;
  updateBoard();

  const winner = checkWinner();
  if (winner) return endGame(winner);
  if (!board.includes("")) return endGame("draw");

  currentPlayer = currentPlayer === "X" ? "O" : "X";

  if (mode === "ai" && currentPlayer === aiChar) {
    setTimeout(() => { aiMove(); }, 600);
  }
}

// AI move
function aiMove() {
  if (!gameActive) return;
  let move;
  if (difficulty === "easy") move = randomMove();
  else if (difficulty === "medium") move = Math.random() < 0.5 ? randomMove() : bestMove();
  else move = bestMove();

  if (move !== undefined) {
    board[move] = aiChar;
    updateBoard();

    const winner = checkWinner();
    if (winner) return endGame(winner);
    if (!board.includes("")) return endGame("draw");

    currentPlayer = playerChar;
  }
}

function randomMove() {
  const available = board.map((v, i) => v === "" ? i : null).filter(v => v !== null);
  return available[Math.floor(Math.random() * available.length)];
}

// Minimax
function bestMove() {
  let bestScore = -Infinity;
  let move;
  for (let i = 0; i < 9; i++) {
    if (board[i] === "") {
      board[i] = aiChar;
      let score = minimax(board, 0, false);
      board[i] = "";
      if (score > bestScore) {
        bestScore = score;
        move = i;
      }
    }
  }
  return move;
}

function minimax(bd, depth, isMax) {
  let result = checkWinnerLogic(bd);
  if (result === aiChar) return 10 - depth;
  if (result === playerChar) return depth - 10;
  if (!bd.includes("")) return 0;

  if (isMax) {
    let best = -Infinity;
    for (let i = 0; i < 9; i++) {
      if (bd[i] === "") { bd[i] = aiChar; best = Math.max(best, minimax(bd, depth + 1, false)); bd[i] = ""; }
    }
    return best;
  } else {
    let best = Infinity;
    for (let i = 0; i < 9; i++) {
      if (bd[i] === "") { bd[i] = playerChar; best = Math.min(best, minimax(bd, depth + 1, true)); bd[i] = ""; }
    }
    return best;
  }
}

// Update board
function updateBoard() {
  document.querySelectorAll(".cell").forEach((cell, i) => {
    cell.textContent = board[i];
    cell.classList.remove("X", "O", "win");
    if (board[i]) cell.classList.add(board[i]);
  });
}

// Check winner
function checkWinner() {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (let combo of wins) {
    const [a,b,c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      highlightWinCells([a,b,c]);
      return board[a];
    }
  }
  return null;
}

function checkWinnerLogic(bd) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (let combo of wins) {
    const [a,b,c] = combo;
    if (bd[a] && bd[a] === bd[b] && bd[a] === bd[c]) return bd[a];
  }
  return null;
}

// Highlight winning cells
function highlightWinCells(cells) {
  cells.forEach(i => {
    const cell = boardDiv.children[i];
    if (cell) cell.classList.add("win");
  });
}

// End game
function endGame(winner) {
  gameActive = false;
  if (winner === "draw") statusDiv.textContent = "It's a draw!";
  else statusDiv.textContent = `${winner} wins! 🎉`;
}

// Restart & dark mode
function restartGame() {
  document.querySelectorAll(".cell").forEach(c => c.remove());
  board = Array(9).fill("");
  gameActive = true;
  if (mode === "ai") showScreen("charSelect");
  else { showScreen("gameScreen"); startGame(); }
}

function toggleDark() { document.body.classList.toggle("dark"); }
