const weeklyList = [];
let selectedWeeklyDish = null;

const weeklySearch = document.getElementById("weekly-dish-search");
const weeklySuggestions = document.getElementById("weekly-dish-suggestions");
const weeklyServing = document.getElementById("weekly-serving-size-display");
const perDayInput = document.getElementById("servings-per-day");
const daysInput = document.getElementById("days-per-week");
const weeklyOutput = document.getElementById("servings-per-week-display");
const weeklyBody = document.getElementById("weekly-table-body");

weeklySearch.addEventListener("input", showWeeklySuggestions);
perDayInput.addEventListener("input", calculateWeekly);
daysInput.addEventListener("input", calculateWeekly);

function showWeeklySuggestions() {
  const query = weeklySearch.value.toLowerCase().trim();
  weeklySuggestions.innerHTML = "";

  if (!query) return;

  const matches = window.DISHES.filter(item =>
    item.dish_name.toLowerCase().includes(query)
  ).slice(0, 10);

  matches.forEach(item => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.textContent = item.dish_name;
    div.onclick = () => selectWeeklyDish(item);
    weeklySuggestions.appendChild(div);
  });
}

function selectWeeklyDish(item) {
  selectedWeeklyDish = item;
  weeklySearch.value = item.dish_name;
  weeklyServing.textContent = item.serving_size;
  weeklySuggestions.innerHTML = "";
}

function calculateWeekly() {
  const a = parseFloat(perDayInput.value) || 0;
  const b = parseFloat(daysInput.value) || 0;
  weeklyOutput.textContent = a * b;
}

document.getElementById("add-weekly-dish-btn").addEventListener("click", addWeekly);

function addWeekly() {
  if (!selectedWeeklyDish) return;

  if (weeklyList.length >= window.WEEKLY_LIMIT) {
    alert("Maximum 50 dishes allowed.");
    return;
  }

  const perDay = parseFloat(perDayInput.value) || 0;
  const days = parseFloat(daysInput.value) || 0;
  const total = perDay * days;

  weeklyList.push({
    dish: selectedWeeklyDish.dish_name,
    serving_size: selectedWeeklyDish.serving_size,
    perDay: perDay,
    days: days,
    total: total
  });

  renderWeekly();
  clearWeeklyInputs();
}

function renderWeekly() {
  weeklyBody.innerHTML = "";

  if (weeklyList.length === 0) {
    weeklyBody.innerHTML =
      `<tr><td colspan="7" class="empty-state">No dishes added yet.</td></tr>`;
    return;
  }

  weeklyList.forEach((item, index) => {
    weeklyBody.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${item.dish}</td>
        <td>${item.serving_size}</td>
        <td>${item.perDay}</td>
        <td>${item.days}</td>
        <td>${item.total}</td>
        <td>
          <button onclick="removeWeekly(${index})">Delete</button>
        </td>
      </tr>
    `;
  });
}

function removeWeekly(index) {
  weeklyList.splice(index, 1);
  renderWeekly();
}

function clearWeeklyInputs() {
  weeklySearch.value = "";
  weeklyServing.textContent = "-";
  perDayInput.value = "";
  daysInput.value = "";
  weeklyOutput.textContent = "0";
  selectedWeeklyDish = null;
}

document.getElementById("clear-weekly-btn").addEventListener("click", () => {
  weeklyList.length = 0;
  renderWeekly();
});
