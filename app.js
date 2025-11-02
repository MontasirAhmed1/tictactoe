// DOM nodes
const modeScreen = document.getElementById("mode-screen");
const charScreen = document.getElementById("char-screen");
const gameScreen = document.getElementById("game-screen");
const modeButtons = modeScreen.querySelectorAll("button[data-mode]");
const charButtons = charScreen.querySelectorAll("button[data-char]");
const toggleButton = document.getElementById("toggle-mode");
const resetButton = document.getElementById("reset");
const boardElement = document.getElementById("board");
const resultElement = document.getElementById("result");
const lineElement = document.getElementById("winning-line");

let board = Array(9).fill("");
let player = "X", ai = "O", currentPlayer = "X";
let gameOver = false, mode = "pvp";

const winCombos = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

// --- Mode selection
modeButtons.forEach(btn=>{
  btn.addEventListener("click", () => {
    mode = btn.dataset.mode;
    modeScreen.classList.remove("active");
    if(mode === "ai") charScreen.classList.add("active");
    else startGame();
  });
});

// --- Toggle dark/light (only on mode screen)
toggleButton.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// --- Character selection
charButtons.forEach(btn=>{
  btn.addEventListener("click", () => {
    player = btn.dataset.char;
    ai = player === "X" ? "O" : "X";
    charScreen.classList.remove("active");
    startGame();
    if (player === "O") aiMoveWithDelay();
  });
});

// --- Start or restart game
function startGame(){
  board.fill("");
  currentPlayer = "X";
  gameOver = false;
  resultElement.innerText = "";
  hideLine();
  gameScreen.classList.add("active");
  renderBoard();
}

// --- Render board (keeps winning-line element inside board)
function renderBoard(highlight = []) {
  boardElement.innerHTML = '<div id="winning-line"></div>';
  for (let i=0; i<9; i++){
    const cell = document.createElement("div");
    cell.className = "cell";
    if (board[i]) cell.classList.add(board[i]);
    if (highlight.includes(i)) cell.classList.add("winner");
    cell.dataset.index = i;
    cell.innerText = board[i];
    cell.addEventListener("click", handleClick);
    boardElement.appendChild(cell);
  }
  // refresh reference to the line element after re-render
  const newLine = document.getElementById("winning-line");
  if (newLine) {
    // copy styles to the global reference
    lineElement.style.width = newLine.style.width || lineElement.style.width;
    // replace the original element in the variable
    // (we keep using lineElement variable which references the element in DOM)
    // but reassign so subsequent code uses the newly created element
    // NOTE: Here we rebind the variable to the current element:
    // (we can't mutate const lineElement directly as it was const; so instead use getElementById when needed)
  }
}

// helper to get current line element (because we re-create it on render)
function getLineEl(){ return document.getElementById("winning-line"); }

// --- Click handler
function handleClick(e){
  const idx = Number(e.currentTarget.dataset.index);
  if (board[idx] === "" && !gameOver) {
    if (mode === "pvp") {
      board[idx] = currentPlayer;
      const win = checkWinner(currentPlayer, true);
      renderBoard(win || []);
      if (!win.length && !gameOver) currentPlayer = currentPlayer === "X" ? "O" : "X";
      if (win.length) drawWinningLine(win);
    } else {
      // vs AI: player is fixed to chosen symbol
      board[idx] = player;
      renderBoard();
      const win = checkWinner(player, true);
      if (win.length) { drawWinningLine(win); return; }
      if (!gameOver) aiMoveWithDelay();
    }
  }
}

// --- AI move with delay
function aiMoveWithDelay(){
  setTimeout(()=>{
    aiMove();
    renderBoard();
    const win = checkWinner(ai, true);
    if (win.length) drawWinningLine(win);
  }, 650);
}

function aiMove(){
  const best = minimax([...board], ai).index;
  if (best !== undefined) board[best] = ai;
}

// --- Winner check
function checkWinner(curr, highlight=false){
  for (let combo of winCombos){
    const [a,b,c] = combo;
    if (board[a] === curr && board[b] === curr && board[c] === curr){
      gameOver = true;
      resultElement.innerText = (mode === "ai" && curr === ai) ? "Computer Wins!" : `${curr} Wins!`;
      return combo;
    }
  }
  if (!board.includes("") && !gameOver){
    gameOver = true;
    resultElement.innerText = "It's a Draw!";
  }
  return [];
}

// --- Draw winning line using DOM positions (precise)
function drawWinningLine(combo){
  const cells = boardElement.querySelectorAll(".cell");
  if (!cells || cells.length < 9) return;
  const startCell = cells[combo[0]];
  const endCell = cells[combo[2]];
  if (!startCell || !endCell) return;

  // board rect and centers
  const boardRect = boardElement.getBoundingClientRect();
  const sRect = startCell.getBoundingClientRect();
  const eRect = endCell.getBoundingClientRect();

  const sX = (sRect.left + sRect.right) / 2 - boardRect.left;
  const sY = (sRect.top + sRect.bottom) / 2 - boardRect.top;
  const eX = (eRect.left + eRect.right) / 2 - boardRect.left;
  const eY = (eRect.top + eRect.bottom) / 2 - boardRect.top;

  const dx = eX - sX;
  const dy = eY - sY;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * (180/Math.PI);

  // Use the actual element inside board (it was re-created on render)
  const lineEl = getLineEl();
  if (!lineEl) return;

  // position: left/top at start center
  lineEl.style.left = `${sX}px`;
  lineEl.style.top = `${sY}px`;
  // width = distance
  lineEl.style.width = `${dist}px`;
  // transform: translateY(-50%) to center vertically, then rotate by angle
  lineEl.style.transform = `translateY(-50%) rotate(${angle}deg)`;
  lineEl.style.transformOrigin = `0 50%`;
  lineEl.style.opacity = "1";

  // highlight winning cells visually
  renderBoard(combo);
}

// --- hide line
function hideLine(){
  const l = getLineEl();
  if (l) { l.style.opacity = "0"; l.style.width = "0"; }
}

// --- Minimax (unchanged)
function minimax(newBoard, curr){
  const avail = newBoard.map((v,i)=> v===""?i:null).filter(v=> v!==null);
  if (checkMini(newBoard, ai)) return {score: 10};
  if (checkMini(newBoard, player)) return {score: -10};
  if (avail.length === 0) return {score: 0};
  const moves = [];
  for (let i of avail){
    const move = { index: i };
    newBoard[i] = curr;
    const result = curr === ai ? minimax(newBoard, player) : minimax(newBoard, ai);
    move.score = result.score;
    newBoard[i] = "";
    moves.push(move);
  }
  let bestMove;
  if (curr === ai){
    let bestScore = -Infinity;
    for (let i=0;i<moves.length;i++){
      if (moves[i].score > bestScore){ bestScore = moves[i].score; bestMove = i; }
    }
  } else {
    let bestScore = Infinity;
    for (let i=0;i<moves.length;i++){
      if (moves[i].score < bestScore){ bestScore = moves[i].score; bestMove = i; }
    }
  }
  return moves[bestMove];
}
function checkMini(bd, curr){
  for (let [a,b,c] of winCombos){
    if (bd[a] === curr && bd[b] === curr && bd[c] === curr) return true;
  }
  return false;
}

// --- Reset / back to mode selection
resetButton.addEventListener("click", ()=>{
  modeScreen.classList.add("active");
  charScreen.classList.remove("active");
  gameScreen.classList.remove("active");
  hideLine();
});
