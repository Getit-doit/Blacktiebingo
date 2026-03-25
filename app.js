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
const callCard = document.getElementById("callCard");
const boardGrid = document.getElementById("boardGrid");
const statusMessage = document.getElementById("statusMessage");
const manualCallForm = document.getElementById("manualCallForm");
const letterSelect = document.getElementById("letterSelect");
const numberInput = document.getElementById("numberInput");
const resetButton = document.getElementById("resetButton");

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
  highlightBoard(entry);
  setStatus(`Now calling ${entry.letter}-${entry.number}.`);
  return true;
}

function resetBoard() {
  calledNumbers.length = 0;
  calledSet.clear();
  currentLetter.textContent = "?";
  currentNumber.textContent = "--";

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

resetButton.addEventListener("click", resetBoard);

buildBoard();
