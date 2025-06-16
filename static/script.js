// Theme handling
const themeToggle = document.getElementById('themeToggle');
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

// Set initial theme
document.documentElement.setAttribute('data-theme', 
  localStorage.getItem('theme') || (prefersDarkScheme.matches ? 'dark' : 'light')
);

// Update theme toggle icon
updateThemeIcon();

themeToggle.addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon();
});

function updateThemeIcon() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const icon = themeToggle.querySelector('i');
  icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Form handling
const stockForm = document.getElementById('stockForm');
const tickerInput = document.getElementById('ticker');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const errorMessage = document.getElementById('errorMessage');
const resultBox = document.getElementById('resultBox');

// Tab handling
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// Loading state
let isLoading = false;

function setLoading(loading) {
  isLoading = loading;
  searchBtn.disabled = loading;
  searchBtn.innerHTML = loading ? 
    '<i class="fas fa-spinner fa-spin"></i> Searching...' : 
    '<i class="fas fa-search"></i> Search';
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
  setTimeout(() => {
    errorMessage.style.display = 'none';
  }, 5000);
}

function clearResults() {
  resultBox.style.display = 'none';
  tickerInput.value = '';
  tickerInput.focus();
  tabContents.forEach(content => content.innerHTML = '');
  tabs.forEach(tab => tab.classList.remove('active'));
  tabs[0].classList.add('active');
  tabContents[0].classList.add('active');
}

function formatNumber(num) {
  if (num === null || num === undefined || num === "N/A") return "N/A";
  return new Intl.NumberFormat('en-US').format(num);
}

function formatCurrency(num) {
  if (num === null || num === undefined || num === "N/A") return "N/A";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num);
}

function formatPercent(num) {
  if (num === null || num === undefined || num === "N/A") return "N/A";
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num / 100);
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  
  // Format the date in the user's local timezone
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short'  // This will show the timezone abbreviation
  }).format(date);
}

function createStockSummary(stock) {
  const changeClass = stock.change >= 0 ? 'positive' : 'negative';
  const changeIcon = stock.change >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
  
  // Format the last price with proper styling
  const lastPrice = stock.last !== null && stock.last !== undefined ? 
    formatCurrency(stock.last) : 
    '<span class="na-value">N/A</span>';
  
  // Format the change with proper styling
  const changeDisplay = stock.change !== null && stock.change !== undefined ?
    `${formatCurrency(Math.abs(stock.change))} (${formatPercent(stock.change_percent)})` :
    '<span class="na-value">N/A</span>';
  
  return `
    <div class="stock-summary">
      <div class="price-section">
        <h2>${lastPrice}</h2>
        <div class="change ${changeClass}">
          <i class="fas ${changeIcon}"></i>
          ${changeDisplay}
        </div>
      </div>
      
      <div class="stock-details">
        <div class="detail-row">
          <span>Open</span>
          <span>${formatCurrency(stock.open)}</span>
        </div>
        <div class="detail-row">
          <span>High</span>
          <span>${formatCurrency(stock.high)}</span>
        </div>
        <div class="detail-row">
          <span>Low</span>
          <span>${formatCurrency(stock.low)}</span>
        </div>
        <div class="detail-row">
          <span>Volume</span>
          <span>${formatNumber(stock.volume)}</span>
        </div>
      </div>
    </div>
  `;
}

function createCompanyOutlook(company) {
  console.log("Company data received:", company);
  // Clean up company name by removing class suffixes
  const cleanName = company.name ? company.name.replace(/ - Class [A-Z]$/, '') : 'N/A';

  // Format the description with proper line breaks
  const formattedDescription = company.description
    ? company.description.replace(/\. /g, '. ').trim()
    : '<span class="na-value">No description available</span>';

  // Try all possible fields for each key detail
  const industry = company.industry || company.industryCode || 'N/A';
  const sector = company.sector || company.sectorCode || 'N/A';
  const website = company.website || company.url || 'N/A';
  const exchange = company.exchangeCode || company.exchange || 'N/A';

  return `
    <div class="company-outlook">
      <div class="company-header">
        <h2>${cleanName} (${company.ticker || ''})</h2>
        <p class="exchange">${exchange}</p>
      </div>
      
      <div class="company-details">
        <div class="detail-section">
          <h3>Company Information</h3>
          <p class="company-description">${formattedDescription}</p>
        </div>
        
        <div class="detail-section">
          <h3>Key Details</h3>
          <table class="company-table">
            <tbody>
              <tr>
                <th>Company Name</th>
                <td>${cleanName}</td>
              </tr>
              <tr>
                <th>Ticker Symbol</th>
                <td>${company.ticker || 'N/A'}</td>
              </tr>
              <tr>
                <th>Exchange</th>
                <td>${exchange}</td>
              </tr>
              <tr>
                <th>Industry</th>
                <td>${industry}</td>
              </tr>
              <tr>
                <th>Sector</th>
                <td>${sector}</td>
              </tr>
              <tr>
                <th>Website</th>
                <td>
                  ${website !== 'N/A' ? 
                    `<a href="${website}" target="_blank" rel="noopener noreferrer">${website}</a>` : 
                    '<span class="na-value">N/A</span>'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function createHistoryList(history) {
  if (!history.length) {
    return '<p class="no-history">No search history available.</p>';
  }

  return `
    <div class="history-list">
      ${history.map(item => `
        <div class="history-item">
          <div class="history-main">
            <span class="ticker">${item.ticker}</span>
            <span class="timestamp">${formatTimestamp(item.timestamp)}</span>
          </div>
          <div class="history-detail">
            <span class="api-time">API Call: ${formatTimestamp(item.api_timestamp)}</span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// Event Listeners
stockForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (isLoading) return;
  
  const ticker = tickerInput.value.trim().toUpperCase();
  if (!ticker) {
    showError('Please enter a stock ticker symbol');
    return;
  }

  setLoading(true);
  errorMessage.style.display = 'none';

  try {
    const response = await fetch(`/search?ticker=${ticker}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch stock data');
    }

    // Update tab contents
    document.getElementById('outlook').innerHTML = createCompanyOutlook(data.company);
    document.getElementById('summary').innerHTML = createStockSummary(data.stock);
    
    // Show results
    resultBox.style.display = 'block';
    
    // Load history
    loadHistory();

    // Add the button after rendering
    setTimeout(() => {
      addWatchlistButton(ticker);
    }, 100);

    // Render notes section
    renderNotesSection(ticker);

    // Save latest price after each search
    setTimeout(() => {
      try {
        const summary = document.getElementById('summary');
        if (summary) {
          const match = summary.innerHTML.match(/\$([\d,.]+)/);
          if (match) {
            setLatestPrice(ticker, parseFloat(match[1].replace(/,/g, '')));
          }
        }
      } catch {}
    }, 200);
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
});

clearBtn.addEventListener('click', clearResults);

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.getAttribute('data-tab');
    
    // Update active states
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    tab.classList.add('active');
    document.getElementById(target).classList.add('active');
  });
});

// Load search history
async function loadHistory() {
  try {
    const response = await fetch('/history');
    const history = await response.json();
    document.getElementById('history').innerHTML = createHistoryList(history);
  } catch (error) {
    console.error('Failed to load history:', error);
  }
}

// Initial history load
loadHistory();

// --- Watchlist Feature ---

// Watchlist UI injection
function ensureWatchlistSidebar() {
  if (!document.getElementById('watchlistSidebar')) {
    const sidebar = document.createElement('div');
    sidebar.id = 'watchlistSidebar';
    sidebar.innerHTML = `
      <h3>Watchlist</h3>
      <ul id="watchlist"></ul>
    `;
    sidebar.style.position = 'fixed';
    sidebar.style.top = '80px';
    sidebar.style.right = '0';
    sidebar.style.width = '220px';
    sidebar.style.background = 'var(--card-background)';
    sidebar.style.borderLeft = '1px solid var(--border-color)';
    sidebar.style.padding = '1rem';
    sidebar.style.zIndex = '1001';
    sidebar.style.height = 'calc(100vh - 80px)';
    sidebar.style.overflowY = 'auto';
    sidebar.style.boxShadow = '0 0 8px rgba(0,0,0,0.05)';
    document.body.appendChild(sidebar);
  }
}

function getWatchlist() {
  return JSON.parse(localStorage.getItem('watchlist') || '[]');
}

function setWatchlist(list) {
  localStorage.setItem('watchlist', JSON.stringify(list));
}

function addToWatchlist(ticker) {
  let list = getWatchlist();
  ticker = ticker.toUpperCase();
  if (!list.includes(ticker)) {
    list.push(ticker);
    setWatchlist(list);
    renderWatchlist();
  }
}

function removeFromWatchlist(ticker) {
  let list = getWatchlist();
  list = list.filter(t => t !== ticker);
  setWatchlist(list);
  renderWatchlist();
}

function renderWatchlist() {
  ensureWatchlistSidebar();
  const list = getWatchlist();
  const ul = document.getElementById('watchlist');
  ul.innerHTML = '';
  if (list.length === 0) {
    ul.innerHTML = '<li style="color:var(--text-secondary);font-style:italic;">No stocks saved.</li>';
    return;
  }
  list.forEach(ticker => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.marginBottom = '0.5rem';
    li.innerHTML = `
      <span class="watchlist-ticker" style="cursor:pointer;color:var(--primary-color);font-weight:600;">${ticker}</span>
      <button class="remove-watchlist" style="background:none;border:none;color:var(--error-color);font-size:1.1rem;cursor:pointer;">&times;</button>
    `;
    li.querySelector('.watchlist-ticker').onclick = () => {
      tickerInput.value = ticker;
      stockForm.dispatchEvent(new Event('submit'));
    };
    li.querySelector('.remove-watchlist').onclick = () => removeFromWatchlist(ticker);
    ul.appendChild(li);
  });
}

// Add Save to Watchlist button to the result area
function addWatchlistButton(ticker) {
  let btn = document.getElementById('watchlistBtn');
  if (!btn) {
    btn = document.createElement('button');
    btn.id = 'watchlistBtn';
    btn.className = 'btn-secondary';
    btn.style.marginLeft = '1rem';
    btn.innerHTML = '<i class="fas fa-star"></i> Save to Watchlist';
    btn.onclick = () => addToWatchlist(ticker);
    // Place the button in the result box header or near the company name
    const outlook = document.getElementById('outlook');
    if (outlook) {
      outlook.prepend(btn);
    } else {
      resultBox.prepend(btn);
    }
  } else {
    btn.onclick = () => addToWatchlist(ticker);
  }
}

// Initial render
renderWatchlist();

// --- Notes/Tags Feature ---
function getStockNotes() {
  return JSON.parse(localStorage.getItem('stockNotes') || '{}');
}

function setStockNotes(notesObj) {
  localStorage.setItem('stockNotes', JSON.stringify(notesObj));
}

function getNoteForTicker(ticker) {
  const notes = getStockNotes();
  return notes[ticker] || '';
}

function saveNoteForTicker(ticker, note) {
  const notes = getStockNotes();
  notes[ticker] = note;
  setStockNotes(notes);
}

function deleteNoteForTicker(ticker) {
  const notes = getStockNotes();
  delete notes[ticker];
  setStockNotes(notes);
}

function renderNotesSection(ticker) {
  let notesBox = document.getElementById('notesBox');
  if (!notesBox) {
    notesBox = document.createElement('div');
    notesBox.id = 'notesBox';
    notesBox.style.marginTop = '1.5rem';
    notesBox.style.background = 'var(--hover-color)';
    notesBox.style.padding = '1rem';
    notesBox.style.borderRadius = '0.5rem';
    notesBox.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)';
    resultBox.appendChild(notesBox);
  }
  notesBox.innerHTML = `
    <h3 style="margin-bottom:0.5rem;">Personal Notes / Tags</h3>
    <textarea id="stockNoteInput" rows="3" style="width:100%;border-radius:0.4rem;padding:0.5rem;border:1px solid var(--border-color);resize:vertical;">${getNoteForTicker(ticker)}</textarea>
    <div style="margin-top:0.5rem;display:flex;gap:0.5rem;">
      <button id="saveNoteBtn" class="btn-primary" style="padding:0.4rem 1.2rem;">Save</button>
      <button id="deleteNoteBtn" class="btn-secondary" style="padding:0.4rem 1.2rem;">Delete</button>
    </div>
    <div id="noteSavedMsg" style="color:var(--success-color);margin-top:0.5rem;display:none;">Saved!</div>
  `;
  document.getElementById('saveNoteBtn').onclick = () => {
    const note = document.getElementById('stockNoteInput').value;
    saveNoteForTicker(ticker, note);
    const msg = document.getElementById('noteSavedMsg');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 1200);
  };
  document.getElementById('deleteNoteBtn').onclick = () => {
    deleteNoteForTicker(ticker);
    document.getElementById('stockNoteInput').value = '';
  };
}

// --- Portfolio Tracker Feature ---
function getPortfolio() {
  return JSON.parse(localStorage.getItem('portfolio') || '[]');
}

function setPortfolio(portfolio) {
  localStorage.setItem('portfolio', JSON.stringify(portfolio));
}

function addPortfolioTransaction(tx) {
  const portfolio = getPortfolio();
  portfolio.push(tx);
  setPortfolio(portfolio);
  renderPortfolioModal();
}

function removePortfolioTransaction(index) {
  const portfolio = getPortfolio();
  portfolio.splice(index, 1);
  setPortfolio(portfolio);
  renderPortfolioModal();
}

function getLatestPrices() {
  // Use last searched prices from history (or cache)
  // We'll use a simple cache in localStorage for latest prices
  return JSON.parse(localStorage.getItem('latestPrices') || '{}');
}

function setLatestPrice(ticker, price) {
  const prices = getLatestPrices();
  prices[ticker] = price;
  localStorage.setItem('latestPrices', JSON.stringify(prices));
}

function calculateHoldings() {
  const portfolio = getPortfolio();
  const holdings = {};
  portfolio.forEach(tx => {
    const t = tx.ticker.toUpperCase();
    if (!holdings[t]) holdings[t] = { shares: 0, cost: 0 };
    if (tx.type === 'buy') {
      holdings[t].shares += Number(tx.shares);
      holdings[t].cost += Number(tx.shares) * Number(tx.price);
    } else if (tx.type === 'sell') {
      holdings[t].shares -= Number(tx.shares);
      holdings[t].cost -= Number(tx.shares) * Number(tx.price); // For simple avg cost
    }
  });
  return holdings;
}

function calculatePortfolioValue() {
  const holdings = calculateHoldings();
  const prices = getLatestPrices();
  let total = 0;
  Object.keys(holdings).forEach(ticker => {
    if (holdings[ticker].shares > 0 && prices[ticker]) {
      total += holdings[ticker].shares * prices[ticker];
    }
  });
  return total;
}

function renderPortfolioModal() {
  let modal = document.getElementById('portfolioModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'portfolioModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.3)';
    modal.style.zIndex = '2000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
  }
  const portfolio = getPortfolio();
  const holdings = calculateHoldings();
  const prices = getLatestPrices();
  const value = calculatePortfolioValue();
  modal.innerHTML = `
    <div style="background:var(--card-background);padding:2rem;border-radius:1rem;min-width:350px;max-width:95vw;max-height:90vh;overflow:auto;box-shadow:0 2px 16px rgba(0,0,0,0.15);">
      <h2 style="margin-bottom:1rem;">Portfolio Tracker</h2>
      
      <form id="portfolioForm" style="margin-bottom:2rem;background:var(--hover-color);padding:1rem;border-radius:0.5rem;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;margin-bottom:1rem;">
          <select id="txType" style="padding:0.5rem;border-radius:0.4rem;border:1px solid var(--border-color);background:var(--card-background);color:var(--text-color);">
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          <input id="txTicker" type="text" placeholder="Ticker" style="padding:0.5rem;border-radius:0.4rem;border:1px solid var(--border-color);background:var(--card-background);color:var(--text-color);" required />
          <input id="txShares" type="number" min="1" placeholder="Shares" style="padding:0.5rem;border-radius:0.4rem;border:1px solid var(--border-color);background:var(--card-background);color:var(--text-color);" required />
          <input id="txPrice" type="number" min="0" step="0.01" placeholder="Price" style="padding:0.5rem;border-radius:0.4rem;border:1px solid var(--border-color);background:var(--card-background);color:var(--text-color);" required />
          <input id="txDate" type="date" style="padding:0.5rem;border-radius:0.4rem;border:1px solid var(--border-color);background:var(--card-background);color:var(--text-color);" />
        </div>
        <button type="submit" class="btn-primary" style="width:100%;">Add Transaction</button>
      </form>

      <div style="margin-bottom:2rem;">
        <h3 style="margin-bottom:1rem;">Transactions</h3>
        <table class="company-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Ticker</th>
              <th>Shares</th>
              <th>Price</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${portfolio.map((tx, i) => `
              <tr>
                <td>${tx.type}</td>
                <td>${tx.ticker.toUpperCase()}</td>
                <td>${tx.shares}</td>
                <td>$${Number(tx.price).toFixed(2)}</td>
                <td>${tx.date || 'N/A'}</td>
                <td>
                  <button onclick="removePortfolioTransaction(${i})" style="background:none;border:none;color:var(--error-color);font-size:1.1rem;cursor:pointer;padding:0.25rem 0.5rem;">&times;</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom:2rem;">
        <h3 style="margin-bottom:1rem;">Holdings</h3>
        <table class="company-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Shares</th>
              <th>Avg Cost</th>
              <th>Last Price</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            ${Object.keys(holdings).filter(t=>holdings[t].shares>0).map(ticker => {
              const shares = holdings[ticker].shares;
              const avgCost = shares > 0 ? (holdings[ticker].cost / shares) : 0;
              const lastPrice = prices[ticker] || 'N/A';
              const value = shares > 0 && lastPrice !== 'N/A' ? (shares * lastPrice) : 0;
              return `<tr>
                <td>${ticker}</td>
                <td>${shares}</td>
                <td>$${avgCost.toFixed(2)}</td>
                <td>${lastPrice !== 'N/A' ? '$'+lastPrice.toFixed(2) : 'N/A'}</td>
                <td>${lastPrice !== 'N/A' ? '$'+value.toFixed(2) : 'N/A'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;background:var(--hover-color);padding:1rem;border-radius:0.5rem;margin-bottom:1rem;">
        <span style="font-weight:600;font-size:1.1rem;">Portfolio Value:</span>
        <span style="font-weight:600;font-size:1.1rem;color:var(--primary-color);">$${value.toFixed(2)}</span>
      </div>

      <button onclick="document.getElementById('portfolioModal').remove();" class="btn-secondary" style="width:100%;">Close</button>
    </div>
  `;
  // Attach form handler
  setTimeout(() => {
    const form = document.getElementById('portfolioForm');
    if (form) {
      form.onsubmit = function(e) {
        e.preventDefault();
        const tx = {
          type: document.getElementById('txType').value,
          ticker: document.getElementById('txTicker').value.trim().toUpperCase(),
          shares: Number(document.getElementById('txShares').value),
          price: Number(document.getElementById('txPrice').value),
          date: document.getElementById('txDate').value
        };
        if (!tx.ticker || !tx.shares || !tx.price) return;
        addPortfolioTransaction(tx);
        form.reset();
      };
    }
  }, 100);
}

// Add Portfolio button to UI
function ensurePortfolioButton() {
  const btn = document.getElementById('portfolioBtn');
  if (btn) {
    btn.onclick = renderPortfolioModal;
  }
}

// --- Company Comparison Feature ---
function ensureComparisonButton() {
  const btn = document.getElementById('comparisonBtn');
  if (btn) {
    btn.onclick = renderComparisonModal;
  }
}

function renderComparisonModal() {
  let modal = document.getElementById('comparisonModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'comparisonModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.3)';
    modal.style.zIndex = '2000';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:var(--card-background);padding:2rem;border-radius:1rem;min-width:350px;max-width:95vw;max-height:90vh;overflow:auto;box-shadow:0 2px 16px rgba(0,0,0,0.15);">
      <h2 style="margin-bottom:1rem;">Compare Companies</h2>
      
      <form id="comparisonForm" style="margin-bottom:2rem;background:var(--hover-color);padding:1rem;border-radius:0.5rem;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-bottom:1rem;">
          <input id="ticker1" type="text" placeholder="First Ticker (e.g., AAPL)" style="padding:0.5rem;border-radius:0.4rem;border:1px solid var(--border-color);background:var(--card-background);color:var(--text-color);" required />
          <input id="ticker2" type="text" placeholder="Second Ticker (e.g., MSFT)" style="padding:0.5rem;border-radius:0.4rem;border:1px solid var(--border-color);background:var(--card-background);color:var(--text-color);" required />
          <input id="ticker3" type="text" placeholder="Third Ticker (optional)" style="padding:0.5rem;border-radius:0.4rem;border:1px solid var(--border-color);background:var(--card-background);color:var(--text-color);" />
        </div>
        <button type="submit" class="btn-primary" style="width:100%;">Compare Companies</button>
      </form>

      <div id="comparisonResults" style="display:none;">
        <div class="comparison-tabs">
          <button class="tab active" data-tab="overview">Overview</button>
          <button class="tab" data-tab="financials">Financials</button>
          <button class="tab" data-tab="ratios">Ratios</button>
          <button class="tab" data-tab="charts">Charts</button>
        </div>

        <div class="comparison-content">
          <div id="overview" class="tab-content active">
            <table class="company-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th id="company1Name">Company 1</th>
                  <th id="company2Name">Company 2</th>
                  <th id="company3Name">Company 3</th>
                </tr>
              </thead>
              <tbody id="overviewData">
                <!-- Overview data will be populated here -->
              </tbody>
            </table>
          </div>

          <div id="financials" class="tab-content">
            <table class="company-table">
              <thead>
                <tr>
                  <th>Financial Metric</th>
                  <th id="company1Name">Company 1</th>
                  <th id="company2Name">Company 2</th>
                  <th id="company3Name">Company 3</th>
                </tr>
              </thead>
              <tbody id="financialsData">
                <!-- Financial data will be populated here -->
              </tbody>
            </table>
          </div>

          <div id="ratios" class="tab-content">
            <table class="company-table">
              <thead>
                <tr>
                  <th>Ratio</th>
                  <th id="company1Name">Company 1</th>
                  <th id="company2Name">Company 2</th>
                  <th id="company3Name">Company 3</th>
                </tr>
              </thead>
              <tbody id="ratiosData">
                <!-- Ratio data will be populated here -->
              </tbody>
            </table>
          </div>

          <div id="charts" class="tab-content">
            <div id="priceChart" style="height:300px;margin-bottom:2rem;"></div>
            <div id="volumeChart" style="height:300px;"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach form handler
  setTimeout(() => {
    const form = document.getElementById('comparisonForm');
    if (form) {
      form.onsubmit = async function(e) {
        e.preventDefault();
        const ticker1 = document.getElementById('ticker1').value.trim().toUpperCase();
        const ticker2 = document.getElementById('ticker2').value.trim().toUpperCase();
        const ticker3 = document.getElementById('ticker3').value.trim().toUpperCase();

        if (!ticker1 || !ticker2) {
          showError('Please enter at least two ticker symbols');
          return;
        }

        try {
          const results = await Promise.all([
            fetchCompanyData(ticker1),
            fetchCompanyData(ticker2),
            ticker3 ? fetchCompanyData(ticker3) : null
          ].filter(Boolean));

          if (results.some(r => !r.ok)) {
            throw new Error('Failed to fetch data for one or more companies');
          }

          const companies = await Promise.all(results.map(r => r.json()));
          displayComparisonResults(companies);
        } catch (error) {
          showError(error.message);
        }
      };
    }

    // Attach tab handlers
    const tabs = modal.querySelectorAll('.comparison-tabs .tab');
    const contents = modal.querySelectorAll('.comparison-content .tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-tab');
        
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(target).classList.add('active');
      });
    });
  }, 100);
}

async function fetchCompanyData(ticker) {
  const response = await fetch(`/search?ticker=${ticker}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch data for ${ticker}`);
  }
  return response;
}

function displayComparisonResults(companies) {
  const resultsDiv = document.getElementById('comparisonResults');
  resultsDiv.style.display = 'block';

  // Update company names in table headers
  companies.forEach((company, index) => {
    const nameElement = document.getElementById(`company${index + 1}Name`);
    if (nameElement) {
      nameElement.textContent = `${company.company.name} (${company.company.ticker})`;
    }
  });

  // Populate overview data
  const overviewData = document.getElementById('overviewData');
  overviewData.innerHTML = `
    <tr>
      <th>Company Name</th>
      ${companies.map(c => `<td>${c.company.name}</td>`).join('')}
    </tr>
    <tr>
      <th>Industry</th>
      ${companies.map(c => `<td>${c.company.industry || 'N/A'}</td>`).join('')}
    </tr>
    <tr>
      <th>Sector</th>
      ${companies.map(c => `<td>${c.company.sector || 'N/A'}</td>`).join('')}
    </tr>
    <tr>
      <th>Exchange</th>
      ${companies.map(c => `<td>${c.company.exchange || 'N/A'}</td>`).join('')}
    </tr>
    <tr>
      <th>Current Price</th>
      ${companies.map(c => `<td>$${c.stock.last?.toFixed(2) || 'N/A'}</td>`).join('')}
    </tr>
    <tr>
      <th>Market Cap</th>
      ${companies.map(c => `<td>${formatNumber(c.stock.marketCap) || 'N/A'}</td>`).join('')}
    </tr>
  `;

  // Populate financials data
  const financialsData = document.getElementById('financialsData');
  financialsData.innerHTML = `
    <tr>
      <th>Revenue (TTM)</th>
      ${companies.map(c => `<td>${formatCurrency(c.stock.revenue) || 'N/A'}</td>`).join('')}
    </tr>
    <tr>
      <th>Net Income (TTM)</th>
      ${companies.map(c => `<td>${formatCurrency(c.stock.netIncome) || 'N/A'}</td>`).join('')}
    </tr>
    <tr>
      <th>EPS (TTM)</th>
      ${companies.map(c => `<td>${formatCurrency(c.stock.eps) || 'N/A'}</td>`).join('')}
    </tr>
    <tr>
      <th>Dividend Yield</th>
      ${companies.map(c => `<td>${formatPercent(c.stock.dividendYield) || 'N/A'}</td>`).join('')}
    </tr>
  `;

  // Populate ratios data
  const ratiosData = document.getElementById('ratiosData');
  ratiosData.innerHTML = `
    <tr>
      <th>P/E Ratio</th>
      ${companies.map(c => `<td>${formatNumber(c.stock.peRatio) || 'N/A'}</td>`).join('')}
    </tr>
    <tr>
      <th>P/B Ratio</th>
      ${companies.map(c => `<td>${formatNumber(c.stock.pbRatio) || 'N/A'}</td>`).join('')}
    </tr>
    <tr>
      <th>Debt/Equity</th>
      ${companies.map(c => `<td>${formatNumber(c.stock.debtToEquity) || 'N/A'}</td>`).join('')}
    </tr>
    <tr>
      <th>ROE</th>
      ${companies.map(c => `<td>${formatPercent(c.stock.roe) || 'N/A'}</td>`).join('')}
    </tr>
  `;

  // Initialize charts
  initializeCharts(companies);
}

function initializeCharts(companies) {
  // This is a placeholder for chart initialization
  // You would typically use a charting library like Chart.js or Highcharts here
  const priceChart = document.getElementById('priceChart');
  const volumeChart = document.getElementById('volumeChart');
  
  // For now, we'll just show a message
  priceChart.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary);">Price chart will be implemented with historical data</div>';
  volumeChart.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--text-secondary);">Volume chart will be implemented with historical data</div>';
}

// Add mobile sidebar toggle
function ensureSidebarToggle() {
  if (!document.getElementById('sidebarToggle')) {
    const toggle = document.createElement('button');
    toggle.id = 'sidebarToggle';
    toggle.className = 'sidebar-toggle';
    toggle.innerHTML = '<i class="fas fa-bars"></i>';
    toggle.onclick = () => {
      const sidebar = document.querySelector('.right-sidebar');
      sidebar.classList.toggle('active');
      toggle.innerHTML = sidebar.classList.contains('active') ? 
        '<i class="fas fa-times"></i>' : 
        '<i class="fas fa-bars"></i>';
    };
    document.body.appendChild(toggle);
  }
}

// Initialize all UI elements
function initializeUI() {
  ensureComparisonButton();
  ensurePortfolioButton();
  ensureSidebarToggle();
}

// Call initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUI);