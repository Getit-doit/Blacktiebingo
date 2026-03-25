const columns = [
  { letter: "B", min: 1, max: 15 },
  { letter: "I", min: 16, max: 30 },
  { letter: "N", min: 31, max: 45 },
  { letter: "G", min: 46, max: 60 },
  { letter: "O", min: 61, max: 75 },
];

const calledNumbers = [];
const calledSet = new Set();

const currentLetter = document.getElementById("currentLetter");
const currentNumber = document.getElementById("currentNumber");
const currentBall = document.getElementById("currentBall");
const callCard = document.getElementById("callCard");
const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");
const boardGrid = document.getElementById("boardGrid");
const statusMessage = document.getElementById("statusMessage");
const manualCallForm = document.getElementById("manualCallForm");
const letterSelect = document.getElementById("letterSelect");
const numberInput = document.getElementById("numberInput");
const randomButton = document.getElementById("randomButton");
const resetButton = document.getElementById("resetButton");
const historyItemTemplate = document.getElementById("historyItemTemplate");

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
      const chip = document.createElement("div");
      chip.className = "board-number";
      chip.textContent = String(value);
      chip.dataset.value = `${column.letter}-${value}`;
      numbers.appendChild(chip);
    }

    wrapper.append(header, numbers);
    boardGrid.appendChild(wrapper);
  });
}

function updateHistory() {
  historyList.innerHTML = "";

  if (calledNumbers.length === 0) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = "No numbers called yet";
    historyList.appendChild(empty);
  }

  calledNumbers
    .slice()
    .reverse()
    .forEach((entry) => {
      const node = historyItemTemplate.content.firstElementChild.cloneNode(true);
      node.querySelector(".history-letter").textContent = entry.letter;
      node.querySelector(".history-number").textContent = entry.number;
      historyList.appendChild(node);
    });

  const count = calledNumbers.length;
  historyCount.textContent = `${count} called${count === 1 ? "" : "s"}`;
}

function triggerReveal() {
  callCard.classList.remove("call-reveal");
  void callCard.offsetWidth;
  callCard.classList.add("call-reveal");
}

function highlightBoard(entry) {
  const selector = `[data-value="${entry.letter}-${entry.number}"]`;
  const chip = boardGrid.querySelector(selector);

  if (!chip) {
    return;
  }

  chip.classList.add("called");
  chip.classList.remove("fresh");
  void chip.offsetWidth;
  chip.classList.add("fresh");
}

function setCurrentCall(entry) {
  currentLetter.textContent = entry.letter;
  currentNumber.textContent = entry.number;
  currentBall.textContent = `${entry.letter}-${entry.number}`;
  triggerReveal();
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function getColumnForNumber(number) {
  return columns.find((column) => number >= column.min && number <= column.max) || null;
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

  if (calledSet.has(`${letter}-${numericValue}`)) {
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
  calledNumbers.push(entry);
  calledSet.add(`${letter}-${result.value}`);

  setCurrentCall(entry);
  updateHistory();
  highlightBoard(entry);
  setStatus(`Now calling ${entry.letter}-${entry.number}.`);
  return true;
}

function getRemainingCalls() {
  const remaining = [];

  columns.forEach((column) => {
    for (let value = column.min; value <= column.max; value += 1) {
      const key = `${column.letter}-${value}`;
      if (!calledSet.has(key)) {
        remaining.push({ letter: column.letter, number: value });
      }
    }
  });

  return remaining;
}

function drawRandomCall() {
  const remaining = getRemainingCalls();

  if (remaining.length === 0) {
    setStatus("All 75 balls have been called.");
    return;
  }

  const entry = remaining[Math.floor(Math.random() * remaining.length)];
  addCall(entry.letter, entry.number);
}

function resetBoard() {
  calledNumbers.length = 0;
  calledSet.clear();
  currentLetter.textContent = "?";
  currentNumber.textContent = "--";
  currentBall.textContent = "Awaiting Call";
  updateHistory();

  boardGrid.querySelectorAll(".board-number").forEach((chip) => {
    chip.classList.remove("called", "fresh");
  });

  setStatus("Board reset. Ready for the next call.");
}

manualCallForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (addCall(letterSelect.value, numberInput.value)) {
    numberInput.value = "";
    numberInput.focus();
  }
});

randomButton.addEventListener("click", drawRandomCall);
resetButton.addEventListener("click", resetBoard);

buildBoard();
updateHistory();
