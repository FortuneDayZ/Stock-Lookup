from flask import Flask, request, jsonify, render_template
import requests
import sqlite3
from datetime import datetime, timedelta, UTC
import json
import defeatbeta_api
from defeatbeta_api.data.ticker import Ticker
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
        # Step 2: Get price data from DefeatBeta API (replacing Yahoo Finance)
        # -----------------------------------------------------------
        defeat_stock = None
        try:
            defeat_stock = Ticker(ticker)
            
            # Get comprehensive company summary data
            try:
                summary_data = defeat_stock.summary()
                if not summary_data.empty:
                    summary_row = summary_data.iloc[0]
                    # Update company data with DefeatBeta summary information
                    company_data.update({
                        "market_cap": float(summary_row['market_cap']) if not pd.isna(summary_row['market_cap']) else None,
                        "enterprise_value": float(summary_row['enterprise_value']) if not pd.isna(summary_row['enterprise_value']) else None,
                        "shares_outstanding": float(summary_row['shares_outstanding']) if not pd.isna(summary_row['shares_outstanding']) else None,
                        "beta": float(summary_row['beta']) if not pd.isna(summary_row['beta']) else None,
                        "trailing_pe": float(summary_row['trailing_pe']) if not pd.isna(summary_row['trailing_pe']) else None,
                        "forward_pe": float(summary_row['forward_pe']) if not pd.isna(summary_row['forward_pe']) else None,
                        "trailing_eps": float(summary_row['tailing_eps']) if not pd.isna(summary_row['tailing_eps']) else None,
                        "forward_eps": float(summary_row['forward_eps']) if not pd.isna(summary_row['forward_eps']) else None,
                        "peg_ratio": float(summary_row['peg_ratio']) if not pd.isna(summary_row['peg_ratio']) else None,
                        "currency": summary_row['currency'] if not pd.isna(summary_row['currency']) else None
                    })
            except Exception as e:
                print("Error fetching DefeatBeta summary data:", e)
            
            # Get additional company information
            try:
                company_info = defeat_stock.info()
                if company_info is not None and not company_info.empty:
                    info_row = company_info.iloc[0]
                    company_data.update({
                        "industry": info_row.get('industry') if not pd.isna(info_row.get('industry')) else company_data.get('industry'),
                        "sector": info_row.get('sector') if not pd.isna(info_row.get('sector')) else company_data.get('sector'),
                        "full_time_employees": int(info_row.get('full_time_employees')) if not pd.isna(info_row.get('full_time_employees')) else None,
                        "website": info_row.get('web_site') if not pd.isna(info_row.get('web_site')) else company_data.get('website'),
                        "long_business_summary": info_row.get('long_business_summary') if not pd.isna(info_row.get('long_business_summary')) else None,
                        "address": info_row.get('address') if not pd.isna(info_row.get('address')) else None,
                        "city": info_row.get('city') if not pd.isna(info_row.get('city')) else None,
                        "country": info_row.get('country') if not pd.isna(info_row.get('country')) else None,
                        "phone": info_row.get('phone') if not pd.isna(info_row.get('phone')) else None
                    })
            except Exception as e:
                print("Error fetching DefeatBeta info:", e)
            
            price_data = defeat_stock.price()
            
            if not price_data.empty:
                # Get the most recent price data (last close)
                latest_price = price_data.iloc[-1]
                # Get previous day's close for change calculation
                if len(price_data) > 1:
                    prev_close = price_data.iloc[-2]['close']
                else:
                    prev_close = latest_price['close']
                # Update stock data with DefeatBeta price information
                stock_data.update({
                    "last_close": float(latest_price['close']) if not pd.isna(latest_price['close']) else None,
                    "prevClose": float(prev_close) if not pd.isna(prev_close) else None,
                    "open": float(latest_price['open']) if not pd.isna(latest_price['open']) else None,
                    "high": float(latest_price['high']) if not pd.isna(latest_price['high']) else None,
                    "low": float(latest_price['low']) if not pd.isna(latest_price['low']) else None,
                    "volume": int(latest_price['volume']) if not pd.isna(latest_price['volume']) else None
                })
                # Try to get additional company info from quarterly income statement
                try:
                    income_stmt = defeat_stock.quarterly_income_statement()
                    if income_stmt is not None and hasattr(income_stmt, 'data') and not income_stmt.data.empty:
                        # Get TTM data from the income statement
                        ttm_data = income_stmt.data.set_index('Breakdown')['TTM']
                        
                        # Extract key financial metrics
                        stock_data.update({
                            "revenue": ttm_data.get("Total Revenue"),
                            "netIncome": ttm_data.get("Net Income Common Stockholders"),
                            "eps": ttm_data.get("Diluted EPS")
                        })
                except Exception as e:
                    print("Error fetching income statement data:", e)
        except Exception as e:
            print("Error fetching DefeatBeta data:", e)
            # Keep existing price data if DefeatBeta fails

        # -----------------------------------------------------------
        # Step 3: Compute change and change_percent if valid
        # -----------------------------------------------------------
        last = stock_data.get("last_close")
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
        # Step 5: Fetch annual income statement data for Gross Profit and EBITDA
        # -----------------------------------------------------------
        try:
            if defeat_stock is not None:
                annual_income_stmt = defeat_stock.annual_income_statement()
                
                print(f"Annual income statement for {ticker}:")
                print(f"Statement object: {annual_income_stmt}")
                
                if annual_income_stmt is not None and hasattr(annual_income_stmt, 'data') and not annual_income_stmt.data.empty:
                    income_data = annual_income_stmt.data
                    print(f"Income data columns: {income_data.columns.tolist()}")
                    print(f"Income data shape: {income_data.shape}")
                    print(f"Breakdown values: {income_data['Breakdown'].values.tolist()}")
                    
                    if len(income_data.columns) > 1:
                        latest_year = income_data.columns[1]  # First column after 'Breakdown'
                        print(f"Latest year column: {latest_year}")
                        
                        # Extract Gross Profit and EBITDA
                        if 'Gross Profit' in income_data['Breakdown'].values:
                            gross_profit = income_data.set_index('Breakdown').loc['Gross Profit', latest_year]
                            print(f"Found Gross Profit: {gross_profit}")
                        else:
                            gross_profit = None
                            print("Gross Profit not found in breakdown")
                        
                        if 'EBITDA' in income_data['Breakdown'].values:
                            ebitda = income_data.set_index('Breakdown').loc['EBITDA', latest_year]
                            print(f"Found EBITDA: {ebitda}")
                        else:
                            ebitda = None
                            print("EBITDA not found in breakdown")
                        
                        stock_data['gross_profit'] = gross_profit
                        stock_data['ebitda'] = ebitda
                    else:
                        print("Income data has insufficient columns")
                        stock_data['gross_profit'] = None
                        stock_data['ebitda'] = None
                else:
                    print("Annual income statement is None or empty")
                    stock_data['gross_profit'] = None
                    stock_data['ebitda'] = None
            else:
                print("Defeat_stock is None, cannot fetch income statement")
                stock_data['gross_profit'] = None
                stock_data['ebitda'] = None
        except Exception as e:
            print('Error fetching annual income statement data:', e)
            import traceback
            traceback.print_exc()
            stock_data['gross_profit'] = None
            stock_data['ebitda'] = None

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
        defeat_stock = Ticker(ticker)
        price_data = defeat_stock.price()
        
        if price_data.empty:
            return jsonify({"error": "No historical data available"}), 404
        
        # Convert period to number of days for filtering
        period_days = {
            "1d": 1, "5d": 5, "1mo": 30, "3mo": 90, "6mo": 180,
            "1y": 365, "2y": 730, "5y": 1825, "10y": 3650, "ytd": 365, "max": 3650
        }
        
        days_to_include = period_days.get(period, 365)
        
        # Filter data to include only the specified period
        # Get the most recent data up to the specified period
        if len(price_data) > days_to_include:
            price_data = price_data.tail(days_to_include)
        
        # Convert to list of dictionaries for JSON serialization
        historical_data = []
        for _, row in price_data.iterrows():
            historical_data.append({
                "date": row['report_date'].strftime('%Y-%m-%d') if hasattr(row['report_date'], 'strftime') else str(row['report_date']),
                "open": float(row['open']) if not pd.isna(row['open']) else None,
                "high": float(row['high']) if not pd.isna(row['high']) else None,
                "low": float(row['low']) if not pd.isna(row['low']) else None,
                "close": float(row['close']) if not pd.isna(row['close']) else None,
                "volume": int(row['volume']) if not pd.isna(row['volume']) else None
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
        defeat_stock = Ticker(ticker)
        price_data = defeat_stock.price()
        
        if price_data.empty or len(price_data) < 2:
            return jsonify({"error": "Insufficient historical data"}), 404
        
        # Convert period to number of days for filtering
        period_days = {
            "1d": 1, "5d": 5, "1mo": 30, "3mo": 90, "6mo": 180,
            "1y": 365, "2y": 730, "5y": 1825, "10y": 3650, "ytd": 365, "max": 3650
        }
        
        days_to_include = period_days.get(period, 365)
        
        # Filter data to include only the specified period
        if len(price_data) > days_to_include:
            price_data = price_data.tail(days_to_include)
        
        # Calculate daily returns
        returns_data = []
        for i in range(1, len(price_data)):
            prev_close = price_data.iloc[i-1]['close']
            curr_close = price_data.iloc[i]['close']
            
            if prev_close > 0:
                daily_return = ((curr_close - prev_close) / prev_close) * 100
            else:
                daily_return = 0
            
            returns_data.append({
                "date": price_data.iloc[i]['report_date'].strftime('%Y-%m-%d') if hasattr(price_data.iloc[i]['report_date'], 'strftime') else str(price_data.iloc[i]['report_date']),
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
        defeat_stock = Ticker(ticker)
        stock_price_data = defeat_stock.price()
        
        if stock_price_data.empty:
            return jsonify({"error": "No stock data available"}), 404
        
        spy_stock = Ticker("SPY")
        market_price_data = spy_stock.price()
        
        if market_price_data.empty:
            return jsonify({"error": "No market data available"}), 404
        
        period_days = {
            "1d": 1, "5d": 5, "1mo": 30, "3mo": 90, "6mo": 180,
            "1y": 365, "2y": 730, "5y": 1825, "10y": 3650, "ytd": 365, "max": 3650
        }
        
        days_to_include = period_days.get(period, 365)
        
        if len(stock_price_data) > days_to_include:
            stock_price_data = stock_price_data.tail(days_to_include)
        if len(market_price_data) > days_to_include:
            market_price_data = market_price_data.tail(days_to_include)
        
        stock_dates = set(stock_price_data['report_date'])
        market_dates = set(market_price_data['report_date'])
        common_dates = sorted(stock_dates.intersection(market_dates))
        
        if len(common_dates) < 30:
            return jsonify({"error": "Insufficient data for beta calculation"}), 404
        
        stock_filtered = stock_price_data[stock_price_data['report_date'].isin(common_dates)].sort_values('report_date')
        market_filtered = market_price_data[market_price_data['report_date'].isin(common_dates)].sort_values('report_date')
        
        stock_returns = stock_filtered['close'].pct_change().dropna()
        market_returns = market_filtered['close'].pct_change().dropna()
        
        min_len = min(len(stock_returns), len(market_returns))
        stock_returns = stock_returns.iloc[-min_len:]
        market_returns = market_returns.iloc[-min_len:]
        
        covariance = stock_returns.cov(market_returns)
        market_variance = market_returns.var()
        
        if market_variance == 0:
            return jsonify({"error": "Cannot calculate beta: market variance is zero"}), 500
        
        beta = covariance / market_variance
        
        stock_volatility = stock_returns.std() * (252 ** 0.5)
        market_volatility = market_returns.std() * (252 ** 0.5)
        
        return jsonify({
            "ticker": ticker,
            "period": period,
            "beta": round(beta, 3),
            "annualized_volatility": round(stock_volatility * 100, 2),
            "market_volatility": round(market_volatility * 100, 2),
            "risk_level": "High" if abs(beta) > 1.5 else "Medium" if abs(beta) > 0.8 else "Low"
        })
        
    except Exception as e:
        print("Error calculating beta:", e)
        return jsonify({"error": "Failed to calculate beta"}), 500

# -----------------------------------------------------------
# Main execution
# -----------------------------------------------------------

if __name__ == '__main__':
    app.run(debug=True, port=5001)