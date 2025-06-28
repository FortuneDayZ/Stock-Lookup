# StockLookup
## 📘 Overview

**StockLookup** is a user-friendly web application that enables users to quickly search and view detailed stock market data using a stock ticker symbol. Built with Flask and modern web technologies, this app fetches real-time data from multiple APIs including Tiingo and DefeatBeta to provide users with a comprehensive interface to view company details, stock summaries, and recent search history.

---

## ✨ Features

- **Stock Lookup**: Enter any ticker symbol to instantly retrieve company information and recent stock performance.
- **Real-Time Data**: Powered by Tiingo API and DefeatBeta API to ensure accurate and up-to-date stock market information.
- **Search History**: Automatically saves your latest searches for easy reference.
- **Tabbed Interface**: Seamlessly switch between Company Outlook, Stock Summary, and Search History.
- **Investment Tools**: Portfolio tracker, company comparison, and performance calculator.
- **Personal Notes**: Add and manage notes for each stock.
- **Theme Toggle**: Switch between light and dark themes.

---

## 🖼️ Screenshots
### 1. WelcomePage
Shows short description of the app.

<img src="https://github.com/FortuneDayZ/TrippyTrips/blob/main/Screenshots/Welcome.jpg?raw=true" width="250" />

### 2. Login & Sign Up Screen
Users can log in or create an account using a simple and intuitive form layout.

<img src="https://github.com/FortuneDayZ/TrippyTrips/blob/main/Screenshots/Login.jpg?raw=true" width="250" />

### 3. Category Search and Location Search
Main navigation screen where users can search and browse by category such as Hotels, Dining, and Activities.

<img src="https://github.com/FortuneDayZ/TrippyTrips/blob/main/Screenshots/Search.jpg?raw=true" width="250" />

### 4. Search Results Screen
Displays a list of relevant places based on user queries, with ratings and add-to-saved buttons.

<img src="https://github.com/FortuneDayZ/TrippyTrips/blob/main/Screenshots/SearchResults.jpg?raw=true" width="250" />

### 5. Saved Items Screen
Shows the list of user-saved places with key details like address and ratings.

<img src="https://github.com/FortuneDayZ/TrippyTrips/blob/main/Screenshots/SavedResults.jpg?raw=true" width="250" />

### 6. Settings Screen
Allows users to change their password, uninstall the app, or delete their account securely.

<img src="https://github.com/FortuneDayZ/TrippyTrips/blob/main/Screenshots/Settings.jpg?raw=true" width="250" />

---

## 🧰 Requirements

- Python 3.x
- Flask
- SQLite
- Requests
- Pandas
- NumPy
- DefeatBeta API
- BeautifulSoup4

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/FortuneDayZ/Stock-Lookup.git
cd Stock-Lookup
```

### 2. Set Up Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Tiingo API

Sign up at [Tiingo](https://www.tiingo.com/) to obtain a free API key.

Replace the placeholder in `app.py` with your API key:

```python
TIINGO_API_KEY = "YOUR_TIINGO_API_KEY"
```

### 5. Run the Application

```bash
python app.py
```

Visit the app in your browser at:

```
http://127.0.0.1:5001
```

---

## 🗂 Project Structure

```
Stock-Lookup/
├── venv/                    # Virtual environment directory (after setup)
├── app.py                  # Main Flask application
├── templates/
│   └── index.html          # Front-end HTML page
├── static/
│   ├── GreenArrowUP.png    # Image for positive stock movement
│   └── RedArrowDown.png    # Image for negative stock movement
├── search_history.db       # SQLite DB for storing search history
├── requirements.txt        # Python dependencies
└── README.md               # This file
```

---

## 🧪 Usage

1. Enter a stock ticker (e.g., `AAPL`) and click **Search**.
2. Navigate between tabs to view:
   - **Company Outlook**
   - **Stock Summary**
   - **Search History**

---

## 🛠 Troubleshooting

- Make sure the Tiingo API key is active and correctly added.
- Double-check your virtual environment is activated.
- If `search_history.db` doesn't exist, it will be created on first app run.

---

## 📄 License

This project is open-source. Feel free to modify, distribute, and use it in your own applications.