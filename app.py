from flask import Flask, render_template
import csv
import os

app = Flask(__name__)

def load_dishes():
    dishes = []
    csv_path = os.path.join("data", "food_list.csv")

    if not os.path.exists(csv_path):
        return dishes

    with open(csv_path, newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            dish_name = (row.get("dish_name") or "").strip()
            if not dish_name:
                continue

            def num(key):
                value = (row.get(key) or "").strip()
                try:
                    return float(value)
                except ValueError:
                    return 0.0

            dishes.append({
                "food_id": (row.get("food_id") or "").strip(),
                "dish_name": dish_name,
                "serving_size": (row.get("serving_size") or "").strip(),
                "unit": (row.get("unit") or "").strip(),
                "weight_g": num("weight_g"),
                "calories": num("calories"),
                "carbs": num("carbs"),
                "protein": num("protein"),
                "fat": num("fat"),
                "fiber": num("fiber"),
                "sugar": num("sugar"),
                "sodium": num("sodium"),
            })

    return dishes

@app.route("/")
@app.route("/recall24")
def recall24():
    dishes = load_dishes()
    return render_template("recall24.html", dishes=dishes)

@app.route("/weekly-frequency")
def weekly_frequency():
    dishes = load_dishes()
    return render_template("weekly_frequency.html", dishes=dishes)

if __name__ == "__main__":
    app.run(debug=True)
