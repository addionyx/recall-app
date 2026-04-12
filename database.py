import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_NAME = os.path.join(BASE_DIR, "recall_app.db")


def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS people (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            dob TEXT NOT NULL,
            UNIQUE(name, dob)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS recalls (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            person_id INTEGER NOT NULL,
            recall_date TEXT NOT NULL,
            FOREIGN KEY (person_id) REFERENCES people (id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS meal_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            recall_id INTEGER NOT NULL,
            meal_name TEXT NOT NULL,
            dish_name TEXT NOT NULL,
            quantity REAL NOT NULL,
            unit TEXT,
            calories REAL,
            carbs REAL,
            protein REAL,
            fat REAL,
            fiber REAL,
            sugar REAL,
            sodium REAL,
            FOREIGN KEY (recall_id) REFERENCES recalls (id)
        )
    """)

    conn.commit()
    conn.close()
