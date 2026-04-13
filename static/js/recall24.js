const dishes = window.DISHES || [];
const meals = window.MEALS || [];
const mealEntries = {};

meals.forEach(meal => {
  mealEntries[meal] = [];
});

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getDishMatches(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return dishes
    .filter(item => item.dish_name.toLowerCase().includes(q))
    .slice(0, 10);
}

function buildMealSections() {
  const container = document.getElementById("meal-sections");
  container.innerHTML = "";

  meals.forEach((mealKey, mealIndex) => {
    const mealId = `meal-${mealIndex}`;

    const section = document.createElement("section");
    section.className = "meal-section";
    section.innerHTML = `
      <div class="meal-title">${mealKey}</div>

      <div class="meal-grid">
        <div class="field-group">
          <label for="${mealId}-dish">Dish</label>
          <input type="text" id="${mealId}-dish" placeholder="Type dish name">
          <div id="${mealId}-suggestions" class="suggestions"></div>
        </div>

        <div class="field-group">
          <label for="${mealId}-servings">Servings</label>
          <input type="number" id="${mealId}-servings" min="0" step="0.5" placeholder="Servings">
        </div>

        <div class="field-group">
          <label>Serving Size</label>
          <div class="readonly-box" id="${mealId}-serving-size">-</div>
        </div>

        <div class="field-group">
          <label>Calories</label>
          <div class="readonly-box" id="${mealId}-calories">0</div>
        </div>

        <div class="field-group">
          <label>Carbs</label>
          <div class="readonly-box" id="${mealId}-carbs">0</div>
        </div>

        <div class="field-group">
          <label>Protein</label>
          <div class="readonly-box" id="${mealId}-protein">0</div>
        </div>

        <div class="field-group">
          <label>Fat</label>
          <div class="readonly-box" id="${mealId}-fat">0</div>
        </div>
      </div>

      <div class="meal-actions">
        <button class="add-btn" id="${mealId}-add-btn">Add</button>
        <button class="clear-btn" id="${mealId}-clear-btn">Clear Input</button>
      </div>

      <div class="meal-table-wrap">
        <table class="meal-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Dish</th>
              <th>Serving Size</th>
              <th>Servings</th>
              <th>Calories</th>
              <th>Carbs</th>
              <th>Protein</th>
              <th>Fat</th>
              <th>Fiber</th>
              <th>Sugar</th>
              <th>Sodium</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="${mealId}-tbody">
            <tr><td colspan="12" class="empty-row">No dishes added yet.</td></tr>
          </tbody>
        </table>
      </div>
    `;

    container.appendChild(section);

    attachMealEvents(mealKey, mealId);
    renderMealTable(mealKey, mealId);
  });

  updateDailyTotals();
}

function attachMealEvents(mealKey, mealId) {
  const dishInput = document.getElementById(`${mealId}-dish`);
  const servingsInput = document.getElementById(`${mealId}-servings`);
  const suggestionBox = document.getElementById(`${mealId}-suggestions`);
  const servingSizeBox = document.getElementById(`${mealId}-serving-size`);
  const caloriesBox = document.getElementById(`${mealId}-calories`);
  const carbsBox = document.getElementById(`${mealId}-carbs`);
  const proteinBox = document.getElementById(`${mealId}-protein`);
  const fatBox = document.getElementById(`${mealId}-fat`);
  const addBtn = document.getElementById(`${mealId}-add-btn`);
  const clearBtn = document.getElementById(`${mealId}-clear-btn`);

  let selectedDish = null;

  function updatePreview() {
    const servings = parseFloat(servingsInput.value) || 0;

    if (!selectedDish) {
      servingSizeBox.textContent = "-";
      caloriesBox.textContent = "0";
      carbsBox.textContent = "0";
      proteinBox.textContent = "0";
      fatBox.textContent = "0";
      return;
    }

    servingSizeBox.textContent = selectedDish.serving_size || "-";
    caloriesBox.textContent = round2(selectedDish.calories * servings);
    carbsBox.textContent = round2(selectedDish.carbs * servings);
    proteinBox.textContent = round2(selectedDish.protein * servings);
    fatBox.textContent = round2(selectedDish.fat * servings);
  }

  function renderSuggestions() {
    const query = dishInput.value;
    suggestionBox.innerHTML = "";

    if (!query.trim()) return;

    const matches = getDishMatches(query);

    matches.forEach(item => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.textContent = item.dish_name;
      div.addEventListener("click", () => {
        selectedDish = item;
        dishInput.value = item.dish_name;
        suggestionBox.innerHTML = "";
        updatePreview();
      });
      suggestionBox.appendChild(div);
    });
  }

  dishInput.addEventListener("input", () => {
    selectedDish = dishes.find(
      d => d.dish_name.toLowerCase() === dishInput.value.trim().toLowerCase()
    ) || null;

    renderSuggestions();
    updatePreview();
  });

  servingsInput.addEventListener("input", updatePreview);

  addBtn.addEventListener("click", () => {
    if (!selectedDish) {
      alert("Please select a dish.");
      return;
    }

    const servings = parseFloat(servingsInput.value) || 0;
    if (servings <= 0) {
      alert("Please enter servings.");
      return;
    }

    const entry = {
      dish_name: selectedDish.dish_name,
      serving_size: selectedDish.serving_size,
      servings: servings,
      calories: round2(selectedDish.calories * servings),
      carbs: round2(selectedDish.carbs * servings),
      protein: round2(selectedDish.protein * servings),
      fat: round2(selectedDish.fat * servings),
      fiber: round2(selectedDish.fiber * servings),
      sugar: round2(selectedDish.sugar * servings),
      sodium: round2(selectedDish.sodium * servings)
    };

    mealEntries[mealKey].push(entry);
    renderMealTable(mealKey, mealId);
    updateDailyTotals();

    selectedDish = null;
    dishInput.value = "";
    servingsInput.value = "";
    suggestionBox.innerHTML = "";
    updatePreview();
  });

  clearBtn.addEventListener("click", () => {
    selectedDish = null;
    dishInput.value = "";
    servingsInput.value = "";
    suggestionBox.innerHTML = "";
    updatePreview();
  });

  document.addEventListener("click", (event) => {
    if (!suggestionBox.contains(event.target) && event.target !== dishInput) {
      suggestionBox.innerHTML = "";
    }
  });
}

function renderMealTable(mealKey, mealId) {
  const tbody = document.getElementById(`${mealId}-tbody`);
  const rows = mealEntries[mealKey];

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="12" class="empty-row">No dishes added yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.dish_name}</td>
      <td>${item.serving_size}</td>
      <td>${item.servings}</td>
      <td>${item.calories}</td>
      <td>${item.carbs}</td>
      <td>${item.protein}</td>
      <td>${item.fat}</td>
      <td>${item.fiber}</td>
      <td>${item.sugar}</td>
      <td>${item.sodium}</td>
      <td><button class="delete-btn" onclick="deleteMealEntry('${mealKey}', ${index})">Delete</button></td>
    </tr>
  `).join("");
}

function deleteMealEntry(mealKey, index) {
  const mealIndex = meals.indexOf(mealKey);
  if (mealIndex === -1) return;
  const mealId = `meal-${mealIndex}`;

  mealEntries[mealKey].splice(index, 1);
  renderMealTable(mealKey, mealId);
  updateDailyTotals();
}

function updateDailyTotals() {
  const total = {
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };

  meals.forEach(meal => {
    mealEntries[meal].forEach(item => {
      total.calories += item.calories;
      total.carbs += item.carbs;
      total.protein += item.protein;
      total.fat += item.fat;
      total.fiber += item.fiber;
      total.sugar += item.sugar;
      total.sodium += item.sodium;
    });
  });

  document.getElementById("total-calories").textContent = round2(total.calories);
  document.getElementById("total-carbs").textContent = round2(total.carbs);
  document.getElementById("total-protein").textContent = round2(total.protein);
  document.getElementById("total-fat").textContent = round2(total.fat);
  document.getElementById("total-fiber").textContent = round2(total.fiber);
  document.getElementById("total-sugar").textContent = round2(total.sugar);
  document.getElementById("total-sodium").textContent = round2(total.sodium);
}

buildMealSections();
window.deleteMealEntry = deleteMealEntry;
