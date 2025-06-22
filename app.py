from flask import Flask, request, jsonify, render_template
import requests
import sqlite3
from datetime import datetime, timedelta, UTC
import json
import yfinance as yf
import pandas as pd

app = Flask(__name__, static_folder='static', static_url_path='/static')

#TODO: PUT YOUR TIINGO KEY HERE
TIINGO_API_KEY = "4f26eaae3b2b6922c9e4019f374a33ce9c81fa30"
TIINGO_BASE_META = "https://api.tiingo.com/tiingo/daily/"
TIINGO_BASE_IEX = "https://api.tiingo.com/iex/"

DB_NAME = "search_history.db"

# -----------------------------------------------------------
# Initialization: Create database and table if not exists
# -----------------------------------------------------------

def init_db():
    with sqlite3.connect(DB_NAME) as conn:
        # Check if the table exists
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='SearchHistory'")
        table_exists = cursor.fetchone() is not None

        if not table_exists:
            # Create new table with all columns
            conn.execute('''
                CREATE TABLE SearchHistory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ticker TEXT NOT NULL,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    company_json TEXT,
                    stock_json TEXT,
                    api_timestamp DATETIME
                )
            ''')
        else:
            # Check if api_timestamp column exists
            cursor = conn.execute("PRAGMA table_info(SearchHistory)")
            columns = [column[1] for column in cursor.fetchall()]
            
            if 'api_timestamp' not in columns:
                # Add api_timestamp column
                conn.execute('ALTER TABLE SearchHistory ADD COLUMN api_timestamp DATETIME')
                
                # Update existing rows to use timestamp as api_timestamp
                conn.execute('''
                    UPDATE SearchHistory 
                    SET api_timestamp = timestamp 
                    WHERE api_timestamp IS NULL
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
        # Step 1: Fetch fresh data from Tiingo API
        # -----------------------------------------------------------
        meta_url = f"{TIINGO_BASE_META}{ticker}?token={TIINGO_API_KEY}"
        iex_url = f"{TIINGO_BASE_IEX}{ticker}?token={TIINGO_API_KEY}"
        fundamentals_url = f"{TIINGO_BASE_META}{ticker}/fundamentals?token={TIINGO_API_KEY}"

        print("Requesting company metadata:", meta_url)
        meta_resp = requests.get(meta_url)
        print("Company metadata response status:", meta_resp.status_code)
        print("Company metadata response body:", meta_resp.text)

        if meta_resp.status_code != 200:
            return jsonify({"error": "No record has been found, please enter a valid symbol."}), 404

        company_data = meta_resp.json()
        
        # Debug print of company data fields
        print("\nCompany Data Fields:")
        print("Name:", company_data.get('name'))
        print("Ticker:", company_data.get('ticker'))
        print("Description:", company_data.get('description'))
        print("Start Date:", company_data.get('startDate'))
        print("Industry:", company_data.get('industry'))
        print("Industry Code:", company_data.get('industryCode'))
        print("Sector:", company_data.get('sector'))
        print("Sector Code:", company_data.get('sectorCode'))
        print("Website:", company_data.get('website'))
        print("URL:", company_data.get('url'))
        print("Exchange:", company_data.get('exchange'))
        print("Exchange Code:", company_data.get('exchangeCode'))
        print("\n")

        # Write company data to JSON file
        with open('company_data.json', 'w') as f:
            json.dump(company_data, f, indent=4)
        print("Company data written to company_data.json")

        print("Requesting IEX data:", iex_url)
        iex_resp = requests.get(iex_url)
        print("IEX response status:", iex_resp.status_code)
        print("IEX response body:", iex_resp.text)

        # Write IEX response to JSON file
        with open('iex_response.json', 'w') as f:
            json.dump(iex_resp.json(), f, indent=4)
        print("IEX response written to iex_response.json")

        if iex_resp.status_code == 200:
            iex_data = iex_resp.json()
            stock_data = iex_data[0] if isinstance(iex_data, list) and iex_data else {}
        else:
            stock_data = {}

        # Fetch fundamentals data
        print("Requesting fundamentals data:", fundamentals_url)
        fundamentals_resp = requests.get(fundamentals_url)
        if fundamentals_resp.status_code == 200:
            fundamentals_data = fundamentals_resp.json()
            if fundamentals_data:
                # Extract key financial metrics
                latest_fundamentals = fundamentals_data[0] if isinstance(fundamentals_data, list) else fundamentals_data
                stock_data.update({
                    "revenue": latest_fundamentals.get("revenue"),
                    "netIncome": latest_fundamentals.get("netIncome"),
                    "eps": latest_fundamentals.get("eps"),
                    "dividendYield": latest_fundamentals.get("dividendYield"),
                    "peRatio": latest_fundamentals.get("peRatio"),
                    "pbRatio": latest_fundamentals.get("pbRatio"),
                    "debtToEquity": latest_fundamentals.get("debtToEquity"),
                    "roe": latest_fundamentals.get("roe"),
                    "marketCap": latest_fundamentals.get("marketCap")
                })

        # -----------------------------------------------------------
        # Step 2: Get price data from Yahoo Finance
        # -----------------------------------------------------------
        try:
            yf_stock = yf.Ticker(ticker)
            yf_info = yf_stock.info
            
            # Debug print of Yahoo Finance data
            print("\nYahoo Finance Data:")
            print("Market Cap:", yf_info.get('marketCap'))
            print("Ex-Dividend Date:", yf_info.get('exDividendDate'))
            print("Full Time Employees:", yf_info.get('fullTimeEmployees'))
            print("Fiscal Year Ends:", yf_info.get('fiscalYearEnds'))
            print("Sector:", yf_info.get('sector'))
            print("Industry:", yf_info.get('industry'))
            print("\n")
            
            # Update stock data with Yahoo Finance price information
            stock_data.update({
                "last": yf_info.get('regularMarketPrice'),
                "prevClose": yf_info.get('regularMarketPreviousClose'),
                "open": yf_info.get('regularMarketOpen'),
                "high": yf_info.get('regularMarketDayHigh'),
                "low": yf_info.get('regularMarketDayLow'),
                "volume": yf_info.get('regularMarketVolume'),
                "marketCapIntraday": yf_info.get('marketCap'),
                "exDividendDate": yf_info.get('exDividendDate'),
                "fullTimeEmployees": yf_info.get('fullTimeEmployees'),
                "fiscalYearEnds": yf_info.get('fiscalYearEnds'),
                "sector": yf_info.get('sector'),
                "industry": yf_info.get('industry')
            })
        except Exception as e:
            print("Error fetching Yahoo Finance data:", e)
            # Keep existing price data if Yahoo Finance fails

        # -----------------------------------------------------------
        # Step 3: Compute change and change_percent if valid
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

        # Get current timestamp for API call using timezone-aware datetime
        api_timestamp = datetime.now(UTC).isoformat()

        # -----------------------------------------------------------
        # Step 4: Save API call data to the database
        # -----------------------------------------------------------
        with sqlite3.connect(DB_NAME) as conn:
            conn.execute('''
                INSERT INTO SearchHistory (ticker, company_json, stock_json, api_timestamp, timestamp)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                ticker,
                str(company_data),
                str(stock_data),
                api_timestamp,
                api_timestamp  # Set timestamp to the same value as api_timestamp
            ))

        print(f"API call data saved for {ticker}")
        return jsonify({
            "company": company_data,
            "stock": stock_data,
            "api_timestamp": api_timestamp
        })

    except Exception as e:
        print("Error occurred during search request:", e)
        return jsonify({"error": "Failed to fetch data from APIs."}), 500

# -----------------------------------------------------------
# Route: Search History API - returns all entries
# -----------------------------------------------------------

@app.route('/history')
def history():
    try:
        with sqlite3.connect(DB_NAME) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute('''
                SELECT ticker, timestamp, api_timestamp
                FROM SearchHistory
                ORDER BY timestamp DESC
            ''').fetchall()

        history = [{
            "ticker": row["ticker"],
            "timestamp": row["timestamp"],
            "api_timestamp": row["api_timestamp"]
        } for row in rows]
        return jsonify(history)
    except Exception as e:
        print("Error loading history:", e)
        return jsonify([])

# -----------------------------------------------------------
# Route: Historical Price Data API
# -----------------------------------------------------------

@app.route('/historical')
def historical():
    ticker = request.args.get("ticker", "").upper().strip()
    period = request.args.get("period", "1y")  # 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
    
    if not ticker:
        return jsonify({"error": "Ticker is required"}), 400
    
    try:
        yf_stock = yf.Ticker(ticker)
        hist = yf_stock.history(period=period)
        
        if hist.empty:
            return jsonify({"error": "No historical data available"}), 404
        
        # Convert to list of dictionaries for JSON serialization
        historical_data = []
        for date, row in hist.iterrows():
            historical_data.append({
                "date": date.strftime('%Y-%m-%d'),
                "open": float(row['Open']) if not pd.isna(row['Open']) else None,
                "high": float(row['High']) if not pd.isna(row['High']) else None,
                "low": float(row['Low']) if not pd.isna(row['Low']) else None,
                "close": float(row['Close']) if not pd.isna(row['Close']) else None,
                "volume": int(row['Volume']) if not pd.isna(row['Volume']) else None
            })
        
        return jsonify({
            "ticker": ticker,
            "period": period,
            "data": historical_data
        })
        
    except Exception as e:
        print("Error fetching historical data:", e)
        return jsonify({"error": "Failed to fetch historical data"}), 500

# -----------------------------------------------------------
# Route: Daily Returns API
# -----------------------------------------------------------

@app.route('/returns')
def returns():
    ticker = request.args.get("ticker", "").upper().strip()
    period = request.args.get("period", "1y")
    
    if not ticker:
        return jsonify({"error": "Ticker is required"}), 400
    
    try:
        yf_stock = yf.Ticker(ticker)
        hist = yf_stock.history(period=period)
        
        if hist.empty or len(hist) < 2:
            return jsonify({"error": "Insufficient historical data"}), 404
        
        # Calculate daily returns
        returns_data = []
        for i in range(1, len(hist)):
            prev_close = hist.iloc[i-1]['Close']
            curr_close = hist.iloc[i]['Close']
            
            if prev_close > 0:
                daily_return = ((curr_close - prev_close) / prev_close) * 100
            else:
                daily_return = 0
            
            returns_data.append({
                "date": hist.index[i].strftime('%Y-%m-%d'),
                "return": round(daily_return, 2),
                "close": float(curr_close) if not pd.isna(curr_close) else None
            })
        
        return jsonify({
            "ticker": ticker,
            "period": period,
            "data": returns_data
        })
        
    except Exception as e:
        print("Error calculating returns:", e)
        return jsonify({"error": "Failed to calculate returns"}), 500

# -----------------------------------------------------------
# Route: Beta Calculation API
# -----------------------------------------------------------

@app.route('/beta')
def beta():
    ticker = request.args.get("ticker", "").upper().strip()
    period = request.args.get("period", "1y")
    
    if not ticker:
        return jsonify({"error": "Ticker is required"}), 400
    
    try:
        # Get stock data
        yf_stock = yf.Ticker(ticker)
        stock_hist = yf_stock.history(period=period)
        
        if stock_hist.empty:
            return jsonify({"error": "No stock data available"}), 404
        
        # Get market data (using SPY as market proxy)
        spy = yf.Ticker("SPY")
        market_hist = spy.history(period=period)
        
        if market_hist.empty:
            return jsonify({"error": "No market data available"}), 404
        
        # Align dates
        common_dates = stock_hist.index.intersection(market_hist.index)
        if len(common_dates) < 30:  # Need at least 30 days for meaningful beta
            return jsonify({"error": "Insufficient data for beta calculation"}), 404
        
        stock_returns = stock_hist.loc[common_dates]['Close'].pct_change().dropna()
        market_returns = market_hist.loc[common_dates]['Close'].pct_change().dropna()
        
        # Calculate beta using covariance method
        covariance = stock_returns.cov(market_returns)
        market_variance = market_returns.var()
        
        if market_variance == 0:
            return jsonify({"error": "Cannot calculate beta: market variance is zero"}), 500
        
        beta = covariance / market_variance
        
        # Calculate additional metrics
        stock_volatility = stock_returns.std() * (252 ** 0.5)  # Annualized volatility
        market_volatility = market_returns.std() * (252 ** 0.5)
        
        return jsonify({
            "ticker": ticker,
            "period": period,
            "beta": round(beta, 3),
            "stock_volatility": round(stock_volatility * 100, 2),  # As percentage
            "market_volatility": round(market_volatility * 100, 2),
            "risk_level": "High" if abs(beta) > 1.5 else "Medium" if abs(beta) > 0.8 else "Low"
        })
        
    except Exception as e:
        print("Error calculating beta:", e)
        return jsonify({"error": "Failed to calculate beta"}), 500

# -----------------------------------------------------------
# Entry Point: Run Flask development server
# -----------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)