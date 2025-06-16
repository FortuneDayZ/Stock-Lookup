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
    ? company.description.replace(/\. /g, '.<br><br>')
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
          <p>${formattedDescription}</p>
        </div>
        <div class="detail-section">
          <h3>Key Details</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Industry</span>
              <span class="value">${industry}</span>
            </div>
            <div class="detail-item">
              <span class="label">Sector</span>
              <span class="value">${sector}</span>
            </div>
            <div class="detail-item">
              <span class="label">Website</span>
              <span class="value">
                ${website !== 'N/A' ? 
                  `<a href="${website}" target="_blank" rel="noopener noreferrer">${website}</a>` : 
                  '<span class="na-value">N/A</span>'}
              </span>
            </div>
          </div>
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