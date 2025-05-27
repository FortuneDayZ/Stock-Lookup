from flask import Flask, request, jsonify, render_template
import requests
import sqlite3
from datetime import datetime, timedelta

app = Flask(__name__, static_folder='static', static_url_path='/static')

#TODO: PUT YOUR TIINGO KEY HERE
TIINGO_API_KEY = "YOUR_KEY"
TIINGO_BASE_META = "https://api.tiingo.com/tiingo/daily/"
TIINGO_BASE_IEX = "https://api.tiingo.com/iex/"

DB_NAME = "search_history.db"

# -----------------------------------------------------------
# Initialization: Create database and table if not exists
# -----------------------------------------------------------

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS SearchHistory (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                company_json TEXT,
                stock_json TEXT,
                last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')

init_db()

# -----------------------------------------------------------
# Route: Home page
# -----------------------------------------------------------

@app.route('/')
def index():
    return render_template("index.html")

# -----------------------------------------------------------
# Route: Stock Search API - returns JSON with company and stock info
# -----------------------------------------------------------

@app.route('/search')
def search():
    ticker = request.args.get("ticker", "").upper().strip()
    print("Received ticker:", ticker)

    if not ticker:
        return jsonify({"error": "Ticker is required"}), 400

    try:
        # -----------------------------------------------------------
        # Step 1: Check if cached data is available (less than 15 mins old)
        # -----------------------------------------------------------
        with sqlite3.connect(DB_NAME) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute('''
                SELECT * FROM SearchHistory
                WHERE ticker = ?
                ORDER BY last_updated DESC
                LIMIT 1
            ''', (ticker,)).fetchone()

            if row:
                last_updated = datetime.fromisoformat(row['last_updated'])
                if datetime.utcnow() - last_updated < timedelta(minutes=15):
                    print(f"Using cached data for {ticker} (cached {datetime.utcnow() - last_updated} ago)")
                    return jsonify({
                        "company": eval(row["company_json"]),
                        "stock": eval(row["stock_json"])
                    })

        # -----------------------------------------------------------
        # Step 2: Fetch fresh data from Tiingo API
        # -----------------------------------------------------------
        meta_url = f"{TIINGO_BASE_META}{ticker}?token={TIINGO_API_KEY}"
        iex_url = f"{TIINGO_BASE_IEX}{ticker}?token={TIINGO_API_KEY}"

        print("Requesting company metadata:", meta_url)
        meta_resp = requests.get(meta_url)
        print("Company metadata response status:", meta_resp.status_code)
        print("Company metadata response body:", meta_resp.text)

        if meta_resp.status_code != 200:
            return jsonify({"error": "No record has been found, please enter a valid symbol."}), 404

        company_data = meta_resp.json()

        print("Requesting IEX data:", iex_url)
        iex_resp = requests.get(iex_url)
        print("IEX response status:", iex_resp.status_code)
        print("IEX response body:", iex_resp.text)

        if iex_resp.status_code == 200:
            iex_data = iex_resp.json()
            stock_data = iex_data[0] if isinstance(iex_data, list) and iex_data else {}
        else:
            stock_data = {}

        # -----------------------------------------------------------
        # Step 3: Ensure expected keys exist to prevent crashes
        # -----------------------------------------------------------
        stock_data.setdefault("last", None)
        stock_data.setdefault("prevClose", None)
        stock_data.setdefault("open", None)
        stock_data.setdefault("high", None)
        stock_data.setdefault("low", None)
        stock_data.setdefault("volume", None)
        stock_data.setdefault("timestamp", None)

        # -----------------------------------------------------------
        # Step 4: Compute change and change_percent if valid
        # -----------------------------------------------------------
        last = stock_data.get("last")
        prev_close = stock_data.get("prevClose")

        if last is not None and prev_close is not None:
            change = round(last - prev_close, 2)
            change_percent = round((change / prev_close) * 100, 2)
        else:
            change = "N/A"
            change_percent = "N/A"

        stock_data["change"] = change
        stock_data["change_percent"] = change_percent

        # -----------------------------------------------------------
        # Step 5: Save fresh data to the database
        # -----------------------------------------------------------
        with sqlite3.connect(DB_NAME) as conn:
            conn.execute('''
                INSERT INTO SearchHistory (ticker, company_json, stock_json, last_updated)
                VALUES (?, ?, ?, ?)
            ''', (
                ticker,
                str(company_data),
                str(stock_data),
                datetime.utcnow().isoformat()
            ))

        print(f"Fresh data saved for {ticker}")
        return jsonify({
            "company": company_data,
            "stock": stock_data
        })

    except Exception as e:
        print("Error occurred during search request:", e)
        return jsonify({"error": "Failed to fetch data from Tiingo."}), 500

# -----------------------------------------------------------
# Route: Search History API - returns 10 most recent entries
# -----------------------------------------------------------

@app.route('/history')
def history():
    try:
        with sqlite3.connect(DB_NAME) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute('''
                SELECT ticker, timestamp
                FROM SearchHistory
                ORDER BY timestamp DESC
                LIMIT 10
            ''').fetchall()

        history = [{"ticker": row["ticker"], "timestamp": row["timestamp"]} for row in rows]
        return jsonify(history)
    except Exception as e:
        print("Error loading history:", e)
        return jsonify([])

# -----------------------------------------------------------
# Entry Point: Run Flask development server
# -----------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)