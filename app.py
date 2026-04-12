from flask import Flask, render_template, jsonify, request
import csv
import os
from datetime import datetime
from database import init_db, get_connection

app = Flask(__name__)
init_db()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FOODS_FILE = os.path.join(BASE_DIR, "data", "food_list.csv")


def read_foods_csv():
    foods = []

    if not os.path.exists(FOODS_FILE):
        return foods

    with open(FOODS_FILE, mode="r", encoding="utf-8-sig") as file:
        reader = csv.DictReader(file)
        for row in reader:
            foods.append({
                "food_id": row["food_id"],
                "name": row["name"],
                "unit": row["unit"],
                "weight_g": float(row["weight_g"]),
                "calories": float(row["calories"]),
                "carbs": float(row["carbs"]),
                "protein": float(row["protein"]),
                "fat": float(row["fat"]),
                "fiber": float(row["fiber"]),
                "sugar": float(row["sugar"]),
                "sodium": float(row["sodium"])
            })

    return foods


def empty_totals():
    return {
        "calories": 0,
        "carbs": 0,
        "protein": 0,
        "fat": 0,
        "fiber": 0,
        "sugar": 0,
        "sodium": 0
    }


def add_to_totals(totals, item):
    totals["calories"] += item["calories"]
    totals["carbs"] += item["carbs"]
    totals["protein"] += item["protein"]
    totals["fat"] += item["fat"]
    totals["fiber"] += item["fiber"]
    totals["sugar"] += item["sugar"]
    totals["sodium"] += item["sodium"]


def build_food_entry(food, quantity):
    return {
        "dish_name": food["name"],
        "quantity": quantity,
        "unit": food["unit"],
        "calories": round(food["calories"] * quantity, 2),
        "carbs": round(food["carbs"] * quantity, 2),
        "protein": round(food["protein"] * quantity, 2),
        "fat": round(food["fat"] * quantity, 2),
        "fiber": round(food["fiber"] * quantity, 2),
        "sugar": round(food["sugar"] * quantity, 2),
        "sodium": round(food["sodium"] * quantity, 2)
    }


def get_or_create_person(name, dob):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id FROM people WHERE name = ? AND dob = ?",
        (name, dob)
    )
    row = cursor.fetchone()

    if row:
        person_id = row["id"]
        conn.close()
        return person_id

    cursor.execute(
        "INSERT INTO people (name, dob) VALUES (?, ?)",
        (name, dob)
    )
    conn.commit()
    person_id = cursor.lastrowid
    conn.close()
    return person_id


def save_profile_to_db(person_name, date_of_birth, recall_date, meals_input):
    foods = read_foods_csv()
    foods_by_name = {food["name"].lower(): food for food in foods}

    person_id = get_or_create_person(person_name, date_of_birth)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "INSERT INTO recalls (person_id, recall_date) VALUES (?, ?)",
        (person_id, recall_date)
    )
    recall_id = cursor.lastrowid

    saved_meals = {}
    grand_totals = empty_totals()

    for meal_name, meal_items in meals_input.items():
        meal_saved_items = []
        meal_totals = empty_totals()

        for item in meal_items:
            dish_name = item.get("dish_name", "").strip().lower()
            quantity = float(item.get("quantity", 1))

            if not dish_name:
                continue

            food = foods_by_name.get(dish_name)
            if not food:
                continue

            built_item = build_food_entry(food, quantity)

            cursor.execute("""
                INSERT INTO meal_items (
                    recall_id, meal_name, dish_name, quantity, unit,
                    calories, carbs, protein, fat, fiber, sugar, sodium
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                recall_id,
                meal_name,
                built_item["dish_name"],
                built_item["quantity"],
                built_item["unit"],
                built_item["calories"],
                built_item["carbs"],
                built_item["protein"],
                built_item["fat"],
                built_item["fiber"],
                built_item["sugar"],
                built_item["sodium"]
            ))

            meal_saved_items.append(built_item)
            add_to_totals(meal_totals, built_item)
            add_to_totals(grand_totals, built_item)

        if meal_saved_items:
            saved_meals[meal_name] = {
                "items": meal_saved_items,
                "totals": {k: round(v, 2) for k, v in meal_totals.items()}
            }

    conn.commit()
    conn.close()

    return {
        "person_name": person_name,
        "date_of_birth": date_of_birth,
        "date": recall_date,
        "meals": saved_meals,
        "grand_totals": {k: round(v, 2) for k, v in grand_totals.items()}
    }


def get_all_profiles_from_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            recalls.id AS recall_id,
            recalls.recall_date,
            people.name AS person_name,
            people.dob AS date_of_birth
        FROM recalls
        JOIN people ON recalls.person_id = people.id
        ORDER BY recalls.id DESC
    """)
    recalls = cursor.fetchall()

    profiles = []

    for recall in recalls:
        recall_id = recall["recall_id"]

        cursor.execute("""
            SELECT
                meal_name, dish_name, quantity, unit,
                calories, carbs, protein, fat, fiber, sugar, sodium
            FROM meal_items
            WHERE recall_id = ?
            ORDER BY id ASC
        """, (recall_id,))
        items = cursor.fetchall()

        meals = {}
        grand_totals = empty_totals()

        for item in items:
            meal_name = item["meal_name"]

            built_item = {
                "dish_name": item["dish_name"],
                "quantity": item["quantity"],
                "unit": item["unit"],
                "calories": item["calories"],
                "carbs": item["carbs"],
                "protein": item["protein"],
                "fat": item["fat"],
                "fiber": item["fiber"],
                "sugar": item["sugar"],
                "sodium": item["sodium"]
            }

            if meal_name not in meals:
                meals[meal_name] = {
                    "items": [],
                    "totals": empty_totals()
                }

            meals[meal_name]["items"].append(built_item)
            add_to_totals(meals[meal_name]["totals"], built_item)
            add_to_totals(grand_totals, built_item)

        for meal_name in meals:
            meals[meal_name]["totals"] = {
                k: round(v, 2) for k, v in meals[meal_name]["totals"].items()
            }

        profiles.append({
            "person_name": recall["person_name"],
            "date_of_birth": recall["date_of_birth"],
            "date": recall["recall_date"],
            "meals": meals,
            "grand_totals": {k: round(v, 2) for k, v in grand_totals.items()}
        })

    conn.close()
    return profiles


@app.route("/")
def home():
    return render_template("recall24.html")


@app.route("/api/foods", methods=["GET"])
def get_foods():
    return jsonify(read_foods_csv())


@app.route("/api/profiles", methods=["GET"])
def get_profiles():
    return jsonify(get_all_profiles_from_db())


@app.route("/api/profiles", methods=["POST"])
def save_profile():
    data = request.get_json()

    person_name = data.get("person_name", "").strip()
    date_of_birth = data.get("date_of_birth", "").strip()
    meals_input = data.get("meals", {})
    recall_date = data.get("date", "").strip()

    if not person_name:
        return jsonify({"error": "Person name is required"}), 400

    if not date_of_birth:
        return jsonify({"error": "Date of birth is required"}), 400

    if not recall_date:
        recall_date = datetime.now().strftime("%Y-%m-%d")

    profile = save_profile_to_db(
        person_name=person_name,
        date_of_birth=date_of_birth,
        recall_date=recall_date,
        meals_input=meals_input
    )

    return jsonify({
        "message": "Profile saved successfully",
        "profile": profile
    })


if __name__ == "__main__":
    app.run(debug=True)
