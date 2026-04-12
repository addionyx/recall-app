let foods = [];

const mealNames = [
  "Early Morning",
  "Breakfast",
  "Mid Day Snack",
  "Lunch",
  "Evening Snack",
  "Dinner",
  "Post Dinner"
];

let mealRows = {};

async function loadFoods() {
  try {
    const response = await fetch("/api/foods");
    foods = await response.json();
    console.log("Foods loaded:", foods);
  } catch (error) {
    console.error("Error loading foods:", error);
  }
}

function makeMealId(mealName) {
  return mealName.toLowerCase().replace(/\s+/g, "-");
}

function createMealSections() {
  const container = document.getElementById("mealSections");
  container.innerHTML = "";

  mealNames.forEach(meal => {
    mealRows[meal] = 0;

    const section = document.createElement("div");
    section.className = "meal-section";
    section.innerHTML = `
      <h2>${meal}</h2>
      <div id="${makeMealId(meal)}-rows"></div>
      <div class="meal-actions">
        <button class="add-btn" onclick="addDishRow('${meal}')">+ Add Dish</button>
      </div>
    `;

    container.appendChild(section);
    addDishRow(meal);
  });
}

function addDishRow(mealName) {
  const mealId = makeMealId(mealName);
  const rowsContainer = document.getElementById(`${mealId}-rows`);

  const rowIndex = mealRows[mealName]++;
  const rowId = `${mealId}-row-${rowIndex}`;

  const row = document.createElement("div");
  row.className = "dish-row";
  row.id = rowId;

  row.innerHTML = `
    <div class="dish-grid">
      <label>Dish</label>
      <div class="dish-search-wrapper">
        <input type="text" id="${rowId}-dishSearch" placeholder="Type dish name">
        <div class="suggestions" id="${rowId}-suggestions"></div>
      </div>

      <div>
        <label>Quantity</label><br>
        <select id="${rowId}-quantity">
          <option value="0.5">0.5</option>
          <option value="1" selected>1</option>
          <option value="1.5">1.5</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
        </select>
      </div>

      <div>
        <label>Preview</label>
        <div class="preview-box" id="${rowId}-preview">No dish selected.</div>
      </div>

      <div>
        <label>Action</label><br>
        <button class="remove-btn" onclick="removeDishRow('${rowId}')">Remove</button>
      </div>
    </div>
  `;

  rowsContainer.appendChild(row);

  const searchInput = document.getElementById(`${rowId}-dishSearch`);
  const quantitySelect = document.getElementById(`${rowId}-quantity`);

  searchInput.dataset.selectedFood = "";

  searchInput.addEventListener("input", () => searchFoods(rowId));
  quantitySelect.addEventListener("change", () => updatePreview(rowId));
}

function removeDishRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
  }
}

function searchFoods(rowId) {
  const input = document.getElementById(`${rowId}-dishSearch`);
  const suggestionsBox = document.getElementById(`${rowId}-suggestions`);
  const query = input.value.trim().toLowerCase();

  suggestionsBox.innerHTML = "";
  input.dataset.selectedFood = "";

  if (!query) {
    suggestionsBox.style.display = "none";
    updatePreview(rowId);
    return;
  }

  const matches = foods.filter(food =>
    food.name.toLowerCase().includes(query)
  );

  if (matches.length === 0) {
    suggestionsBox.style.display = "none";
    return;
  }

  matches.forEach(food => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.textContent = `${food.name} (${food.unit})`;
    item.addEventListener("click", () => selectFood(rowId, food));
    suggestionsBox.appendChild(item);
  });

  suggestionsBox.style.display = "block";
}

function selectFood(rowId, food) {
  const input = document.getElementById(`${rowId}-dishSearch`);
  const suggestionsBox = document.getElementById(`${rowId}-suggestions`);

  input.value = food.name;
  input.dataset.selectedFood = JSON.stringify(food);

  suggestionsBox.innerHTML = "";
  suggestionsBox.style.display = "none";

  updatePreview(rowId);
}

function updatePreview(rowId) {
  const input = document.getElementById(`${rowId}-dishSearch`);
  const preview = document.getElementById(`${rowId}-preview`);
  const quantity = parseFloat(document.getElementById(`${rowId}-quantity`).value || "1");

  if (!input.dataset.selectedFood) {
    preview.innerHTML = "No dish selected.";
    return;
  }

  const food = JSON.parse(input.dataset.selectedFood);

  const calories = (food.calories * quantity).toFixed(2);
  const carbs = (food.carbs * quantity).toFixed(2);
  const protein = (food.protein * quantity).toFixed(2);
  const fat = (food.fat * quantity).toFixed(2);
  const fiber = (food.fiber * quantity).toFixed(2);
  const sugar = (food.sugar * quantity).toFixed(2);
  const sodium = (food.sodium * quantity).toFixed(2);

  preview.innerHTML = `
    <div><strong>${food.name}</strong></div>
    <div>Qty: ${quantity} ${food.unit}</div>
    <div>Cal: ${calories} | Carbs: ${carbs}g | Protein: ${protein}g</div>
    <div>Fat: ${fat}g | Fiber: ${fiber}g | Sugar: ${sugar}g | Sodium: ${sodium}mg</div>
  `;
}

function collectMealsData() {
  const meals = {};

  mealNames.forEach(meal => {
    const mealId = makeMealId(meal);
    const rowsContainer = document.getElementById(`${mealId}-rows`);
    const rows = rowsContainer.querySelectorAll(".dish-row");

    const mealItems = [];

    rows.forEach(row => {
      const rowId = row.id;
      const input = document.getElementById(`${rowId}-dishSearch`);
      const quantity = parseFloat(document.getElementById(`${rowId}-quantity`).value || "1");

      if (!input.dataset.selectedFood) {
        return;
      }

      const food = JSON.parse(input.dataset.selectedFood);

      mealItems.push({
        dish_name: food.name,
        quantity: quantity
      });
    });

    if (mealItems.length > 0) {
      meals[meal] = mealItems;
    }
  });

  return meals;
}

async function saveProfile() {
  const personName = document.getElementById("personName").value.trim();
  const dateOfBirth = document.getElementById("dateOfBirth").value;
  const recallDate = document.getElementById("recallDate").value;
  const meals = collectMealsData();

  if (!personName) {
    alert("Please enter person name.");
    return;
  }

  if (!dateOfBirth) {
    alert("Please enter date of birth.");
    return;
  }

  if (Object.keys(meals).length === 0) {
    alert("Please add at least one selected dish.");
    return;
  }

  try {
    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        person_name: personName,
        date_of_birth: dateOfBirth,
        date: recallDate,
        meals: meals
      })
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to save profile.");
      return;
    }

    alert("Profile saved successfully.");
    await loadProfiles();
  } catch (error) {
    console.error("Error saving profile:", error);
    alert("Something went wrong while saving.");
  }
}

function renderMealTable(mealName, mealData) {
  const items = mealData.items;
  const totals = mealData.totals;

  let rows = items.map(item => `
    <tr>
      <td>${item.dish_name}</td>
      <td>${item.quantity}</td>
      <td>${item.unit}</td>
      <td>${item.calories}</td>
      <td>${item.carbs}</td>
      <td>${item.protein}</td>
      <td>${item.fat}</td>
      <td>${item.fiber}</td>
      <td>${item.sugar}</td>
      <td>${item.sodium}</td>
    </tr>
  `).join("");

  rows += `
    <tr>
      <td><strong>Meal Total</strong></td>
      <td></td>
      <td></td>
      <td><strong>${totals.calories}</strong></td>
      <td><strong>${totals.carbs}</strong></td>
      <td><strong>${totals.protein}</strong></td>
      <td><strong>${totals.fat}</strong></td>
      <td><strong>${totals.fiber}</strong></td>
      <td><strong>${totals.sugar}</strong></td>
      <td><strong>${totals.sodium}</strong></td>
    </tr>
  `;

  return `
    <h3>${mealName}</h3>
    <table>
      <thead>
        <tr>
          <th>Dish</th>
          <th>Qty</th>
          <th>Unit</th>
          <th>Calories</th>
          <th>Carbs</th>
          <th>Protein</th>
          <th>Fat</th>
          <th>Fiber</th>
          <th>Sugar</th>
          <th>Sodium</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

async function loadProfiles() {
  const entriesList = document.getElementById("entriesList");

  try {
    const response = await fetch("/api/profiles");
    const profiles = await response.json();

    if (!profiles.length) {
      entriesList.innerHTML = "No entries yet.";
      return;
    }

    entriesList.innerHTML = "";

    profiles.forEach(profile => {
      let mealsHtml = "";

      for (const [mealName, mealData] of Object.entries(profile.meals)) {
        mealsHtml += renderMealTable(mealName, mealData);
      }

      const grand = profile.grand_totals;

      const card = document.createElement("div");
      card.className = "entry-card";
      card.innerHTML = `
        <h2>${profile.person_name} - ${profile.date}</h2>
        <p><strong>Date of Birth:</strong> ${profile.date_of_birth}</p>
        ${mealsHtml}
        <h3>Grand Total</h3>
        <table>
          <thead>
            <tr>
              <th>Calories</th>
              <th>Carbs</th>
              <th>Protein</th>
              <th>Fat</th>
              <th>Fiber</th>
              <th>Sugar</th>
              <th>Sodium</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${grand.calories}</td>
              <td>${grand.carbs}</td>
              <td>${grand.protein}</td>
              <td>${grand.fat}</td>
              <td>${grand.fiber}</td>
              <td>${grand.sugar}</td>
              <td>${grand.sodium}</td>
            </tr>
          </tbody>
        </table>
      `;

      entriesList.appendChild(card);
    });
  } catch (error) {
    console.error("Error loading profiles:", error);
    entriesList.innerHTML = "Could not load profiles.";
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  await loadFoods();
  createMealSections();
  await loadProfiles();

  document.getElementById("saveAllBtn").addEventListener("click", saveProfile);

  document.addEventListener("click", function (event) {
    document.querySelectorAll(".suggestions").forEach(box => {
      const relatedInput = box.previousElementSibling;
      if (event.target !== relatedInput && !box.contains(event.target)) {
        box.style.display = "none";
      }
    });
  });
});
