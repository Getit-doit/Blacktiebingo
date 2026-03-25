const columns = [
  { letter: "B", min: 1, max: 15 },
  { letter: "I", min: 16, max: 30 },
  { letter: "N", min: 31, max: 45 },
  { letter: "G", min: 46, max: 60 },
  { letter: "O", min: 61, max: 75 },
];

const storageKey = "bingo-roll-display-state";

const currentLetter = document.getElementById("currentLetter");
const currentNumber = document.getElementById("currentNumber");
const callCard = document.getElementById("callCard");
const boardGrid = document.getElementById("boardGrid");
const statusMessage = document.getElementById("statusMessage");
const resetButton = document.getElementById("resetButton");

let state = loadState();

function createEmptyState() {
  return {
    currentCall: null,
    calledNumbers: [],
    lastUpdated: Date.now(),
  };
}

function loadState() {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      return createEmptyState();
    }

    const parsed = JSON.parse(saved);
    if (!parsed || !Array.isArray(parsed.calledNumbers)) {
      return createEmptyState();
    }

    return {
      currentCall: parsed.currentCall ?? null,
      calledNumbers: parsed.calledNumbers,
      lastUpdated: parsed.lastUpdated ?? Date.now(),
    };
  } catch (_error) {
    return createEmptyState();
  }
}

function persistState() {
  state.lastUpdated = Date.now();
  window.localStorage.setItem(storageKey, JSON.stringify(state));
}

function buildBoard() {
  boardGrid.innerHTML = "";

  columns.forEach((column) => {
    const wrapper = document.createElement("section");
    wrapper.className = "board-column";

    const header = document.createElement("div");
    header.className = "board-column-header";
    header.innerHTML = `
      <h3>${column.letter}</h3>
      <span class="board-column-range">${column.min}-${column.max}</span>
    `;

    const numbers = document.createElement("div");
    numbers.className = "board-numbers";

    for (let value = column.min; value <= column.max; value += 1) {
      const chip = document.createElement("button");
      chip.className = "board-number";
      chip.type = "button";
      chip.setAttribute("aria-label", `Call ${column.letter}-${value}`);
      chip.textContent = String(value);
      chip.dataset.value = `${column.letter}-${value}`;
      numbers.appendChild(chip);
    }

    wrapper.append(header, numbers);
    boardGrid.appendChild(wrapper);
  });
}

function triggerReveal() {
  callCard.classList.remove("call-reveal");
  void callCard.offsetWidth;
  callCard.classList.add("call-reveal");
}

function getColumnForNumber(number) {
  return columns.find((column) => number >= column.min && number <= column.max) || null;
}

function getEntryKey(entry) {
  return `${entry.letter}-${entry.number}`;
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function renderBoard() {
  const calledSet = new Set(state.calledNumbers.map(getEntryKey));

  boardGrid.querySelectorAll(".board-number").forEach((chip) => {
    const isCalled = calledSet.has(chip.dataset.value);
    chip.classList.toggle("called", isCalled);
    if (!isCalled) {
      chip.classList.remove("fresh");
    }
  });
}

function renderCurrentCall(options = {}) {
  if (!state.currentCall) {
    currentLetter.textContent = "?";
    currentNumber.textContent = "--";
    return;
  }

  currentLetter.textContent = state.currentCall.letter;
  currentNumber.textContent = state.currentCall.number;

  if (options.animate) {
    triggerReveal();
  }
}

function renderState(options = {}) {
  renderCurrentCall(options);
  renderBoard();
}

function markLatestChipFresh(entry) {
  const chip = boardGrid.querySelector(`[data-value="${getEntryKey(entry)}"]`);
  if (!chip) {
    return;
  }

  chip.classList.remove("fresh");
  void chip.offsetWidth;
  chip.classList.add("fresh");
}

function validateEntry(letter, number) {
  const numericValue = Number(number);

  if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > 75) {
    return { valid: false, message: "Enter a whole number from 1 to 75." };
  }

  const expectedColumn = getColumnForNumber(numericValue);

  if (!expectedColumn || expectedColumn.letter !== letter) {
    return {
      valid: false,
      message: `${numericValue} belongs in ${expectedColumn ? expectedColumn.letter : "a valid"} column.`,
    };
  }

  const duplicate = state.calledNumbers.some(
    (entry) => entry.letter === letter && entry.number === numericValue,
  );

  if (duplicate) {
    return { valid: false, message: `${letter}-${numericValue} has already been called.` };
  }

  return { valid: true, value: numericValue };
}

function addCall(letter, number) {
  const result = validateEntry(letter, number);

  if (!result.valid) {
    setStatus(result.message);
    return false;
  }

  const entry = { letter, number: result.value };
  state = {
    currentCall: entry,
    calledNumbers: [...state.calledNumbers, entry],
    lastUpdated: Date.now(),
  };

  persistState();
  renderState({ animate: true });
  markLatestChipFresh(entry);
  setStatus(`Now calling ${entry.letter}-${entry.number}.`);
  return true;
}

function resetBoard() {
  state = createEmptyState();
  persistState();
  renderState();
  setStatus("Board reset. Ready for the next call.");
}

boardGrid.addEventListener("click", (event) => {
  const chip = event.target.closest(".board-number");
  if (!chip || chip.classList.contains("called")) {
    return;
  }

  const [letter, number] = chip.dataset.value.split("-");
  addCall(letter, Number(number));
});

resetButton.addEventListener("click", resetBoard);

buildBoard();
renderState();
