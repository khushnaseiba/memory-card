import init, { Game } from "./pkg/memory_card_wasm.js";

const symbols = ["🍎", "🚀", "🎸", "🌙", "🐙", "⚡", "🍀", "🎲"];
const board = document.querySelector("#board");
const status = document.querySelector("#status");
const scoreOne = document.querySelector("#score-one");
const scoreTwo = document.querySelector("#score-two");
const matchedCount = document.querySelector("#matched-count");
const playerOne = document.querySelector("#player-one");
const playerTwo = document.querySelector("#player-two");
const restart = document.querySelector("#restart");

let game;
let cardButtons = [];
let mismatchTimer;
let lastPlayer = null;
let celebrated = false;

function createBoard() {
  board.replaceChildren();
  cardButtons = [];

  for (let index = 0; index < game.card_count(); index += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card";
    button.style.setProperty("--i", index);
    button.setAttribute("aria-label", "Hidden card");

    const inner = document.createElement("span");
    inner.className = "card-inner";

    const front = document.createElement("span");
    front.className = "card-face card-front";
    front.textContent = symbols[game.card_value(index)];

    const back = document.createElement("span");
    back.className = "card-face card-back";
    back.textContent = "?";

    inner.append(front, back);
    button.append(inner);
    button.addEventListener("click", () => flipCard(index));
    board.append(button);
    cardButtons.push(button);
  }
}

function flipCard(index) {
  const action = game.flip(index);

  if (action === 0) {
    return;
  }

  if (action === 3) {
    render("No match");
    mismatchTimer = window.setTimeout(() => {
      game.resolve_mismatch();
      render();
    }, 850);
    return;
  }

  render(action === 2 ? "Match" : "");
}

function replayHint(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function startConfetti() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const context = canvas.getContext("2d");
  const palette = ["#f5b942", "#6d8bd1", "#7cc47f", "#e07a9a", "#8b6fd1", "#5fc9c1"];

  let width = 0;
  let height = 0;
  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const pieces = Array.from({ length: 170 }, () => ({
    x: Math.random() * width,
    y: -height * 0.5 + Math.random() * height * 0.8,
    size: 6 + Math.random() * 7,
    speed: 150 + Math.random() * 220,
    sway: Math.random() * Math.PI * 2,
    swaySpeed: 1.4 + Math.random() * 2.4,
    spin: (Math.random() - 0.5) * 8,
    rotation: Math.random() * Math.PI,
    color: palette[Math.floor(Math.random() * palette.length)],
  }));

  const duration = 4200;
  const fadeWindow = 900;
  const start = performance.now();
  let previous = start;
  let frame;

  const tick = (now) => {
    const delta = Math.min(0.05, (now - previous) / 1000);
    previous = now;
    const elapsed = now - start;
    const fade = Math.max(0, Math.min(1, (duration - elapsed) / fadeWindow));

    context.clearRect(0, 0, width, height);
    context.globalAlpha = fade;
    for (const piece of pieces) {
      piece.y += piece.speed * delta;
      piece.sway += piece.swaySpeed * delta;
      piece.rotation += piece.spin * delta;
      if (piece.y > height + 24) {
        continue;
      }
      context.save();
      context.translate(piece.x + Math.sin(piece.sway) * 20, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
      context.restore();
    }

    if (elapsed < duration) {
      frame = requestAnimationFrame(tick);
    } else {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.remove();
    }
  };

  frame = requestAnimationFrame(tick);
}

function render(message = "") {
  for (let index = 0; index < cardButtons.length; index += 1) {
    const button = cardButtons[index];
    const faceUp = game.is_face_up(index);
    const matched = game.is_matched(index);
    button.classList.toggle("is-up", faceUp);
    button.classList.toggle("is-matched", matched);
    button.setAttribute(
      "aria-label",
      matched || faceUp ? `Card ${symbols[game.card_value(index)]}` : "Hidden card",
    );
  }

  const currentPlayer = game.current_player();
  const isOver = game.is_game_over();
  const firstScore = game.score(1);
  const secondScore = game.score(2);
  const winner = isOver ? (firstScore === secondScore ? 0 : firstScore > secondScore ? 1 : 2) : null;

  scoreOne.textContent = firstScore;
  scoreTwo.textContent = secondScore;
  matchedCount.textContent = game.matched_pairs();
  playerOne.classList.toggle("active", !isOver && currentPlayer === 1);
  playerTwo.classList.toggle("active", !isOver && currentPlayer === 2);
  playerOne.classList.toggle("is-winner", winner === 1);
  playerTwo.classList.toggle("is-winner", winner === 2);
  status.classList.remove("is-turn", "is-win", "is-tie");

  if (isOver) {
    if (winner === 0) {
      status.textContent = `Game over. It's a tie, ${firstScore}–${secondScore}.`;
      status.classList.add("is-tie");
    } else {
      status.textContent = `Game over. Player ${winner} wins, ${Math.max(firstScore, secondScore)}–${Math.min(firstScore, secondScore)}.`;
      status.classList.add("is-win");
    }
    if (!celebrated) {
      celebrated = true;
      board.classList.add("celebrate");
      startConfetti();
    }
    lastPlayer = null;
    return;
  }

  celebrated = false;
  board.classList.remove("celebrate");

  const turnChanged = lastPlayer !== null && lastPlayer !== currentPlayer;
  if (turnChanged) {
    replayHint(currentPlayer === 1 ? playerOne : playerTwo, "turn-hint");
    replayHint(status, "is-turn");
  }
  lastPlayer = currentPlayer;

  if (message === "No match") {
    status.textContent = message;
  } else if (message === "Match") {
    status.textContent = `Match! Player ${currentPlayer} plays again.`;
  } else {
    status.textContent = `Player ${currentPlayer}'s turn.`;
  }
}

async function startGame() {
  window.clearTimeout(mismatchTimer);
  await init();
  game = new Game();
  lastPlayer = null;
  celebrated = false;
  status.classList.remove("is-turn", "is-win", "is-tie");
  board.classList.remove("celebrate");
  createBoard();
  render();
}

restart.addEventListener("click", startGame);
startGame().catch((error) => {
  status.textContent = "Could not load the WASM game. Check the build steps in README.md.";
  console.error(error);
});
