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
  const lastPrice = stock.last_close !== null && stock.last_close !== undefined ? 
    formatCurrency(stock.last_close) : 
    '<span class="na-value">N/A</span>';
  
  // Format the change with proper styling
  const changeDisplay = stock.change !== null && stock.change !== undefined ?
    `${formatCurrency(Math.abs(stock.change))} (${formatPercent(stock.change_percent)})` :
    '<span class="na-value">N/A</span>';
  
  return `
    <div class="stock-summary">
      <div class="price-section">
        <h2>${lastPrice}</h2>
        <div class="price-label">Last Close</div>
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

      <!-- Price History Chart Section -->
      <div class="chart-section">
        <div class="chart-header">
          <h3><i class="fas fa-chart-line"></i> Price History</h3>
          <div class="timeframe-selector">
            <button class="timeframe-btn active" data-period="1d">1D</button>
            <button class="timeframe-btn" data-period="5d">5D</button>
            <button class="timeframe-btn" data-period="1mo">1M</button>
            <button class="timeframe-btn" data-period="6mo">6M</button>
            <button class="timeframe-btn" data-period="1y">1Y</button>
            <button class="timeframe-btn" data-period="5y">5Y</button>
            <button class="timeframe-btn" data-period="max">MAX</button>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="priceHistoryChart"></canvas>
        </div>
      </div>

      <!-- Daily Returns Chart Section -->
      <div class="chart-section">
        <div class="chart-header">
          <h3><i class="fas fa-chart-bar"></i> Daily Returns</h3>
          <div class="timeframe-selector">
            <button class="timeframe-btn active" data-period="1mo">1M</button>
            <button class="timeframe-btn" data-period="3mo">3M</button>
            <button class="timeframe-btn" data-period="6mo">6M</button>
            <button class="timeframe-btn" data-period="1y">1Y</button>
          </div>
        </div>
        <div class="chart-container">
          <canvas id="returnsChart"></canvas>
        </div>
      </div>

      <!-- Beta and Risk Metrics Section -->
      <div class="chart-section">
        <div class="chart-header">
          <h3><i class="fas fa-shield-alt"></i> Risk Metrics</h3>
        </div>
        <div class="beta-container">
          <div class="beta-loading">
            <i class="fas fa-spinner fa-spin"></i> Loading risk metrics...
          </div>
        </div>
      </div>
    </div>
  `;
}

// Initialize Price History Chart
function initializePriceHistoryChart(ticker, period = '1y') {
  try {
    const ctx = document.getElementById('priceHistoryChart');
    if (!ctx) {
      console.error('Price history chart canvas not found');
      return;
    }

    // Destroy existing chart if it exists
    if (window.priceHistoryChart instanceof Chart) {
      window.priceHistoryChart.destroy();
    }

    // Show loading state
    ctx.style.display = 'none';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chart-loading';
    loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading price data...';
    ctx.parentNode.appendChild(loadingDiv);

    // Fetch historical data
    fetch(`/historical?ticker=${ticker}&period=${period}`)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }

        // Remove loading state
        loadingDiv.remove();
        ctx.style.display = 'block';

        const dates = data.data.map(item => item.date);
        const closes = data.data.map(item => item.close);
        const volumes = data.data.map(item => item.volume);

        // Create gradient for the line
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(54, 162, 235, 0.8)');
        gradient.addColorStop(1, 'rgba(54, 162, 235, 0.1)');

        window.priceHistoryChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: dates,
            datasets: [{
              label: 'Close Price',
              data: closes,
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: gradient,
              borderWidth: 2,
              fill: true,
              tension: 0.1,
              pointRadius: 0,
              pointHoverRadius: 6,
              pointHoverBackgroundColor: 'rgba(54, 162, 235, 1)',
              pointHoverBorderColor: '#fff',
              pointHoverBorderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: 'index'
            },
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Date'
                },
                ticks: {
                  maxTicksLimit: 10
                }
              },
              y: {
                display: true,
                title: {
                  display: true,
                  text: 'Price ($)'
                },
                ticks: {
                  callback: function(value) {
                    return '$' + value.toFixed(2);
                  }
                }
              }
            },
            plugins: {
              title: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return 'Price: $' + context.parsed.y.toFixed(2);
                  }
                }
              }
            }
          }
        });
      })
      .catch(error => {
        console.error('Error loading price history:', error);
        loadingDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading data';
      });
  } catch (error) {
    console.error('Error initializing price history chart:', error);
  }
}

// Initialize Daily Returns Chart
function initializeReturnsChart(ticker, period = '1y') {
  try {
    const ctx = document.getElementById('returnsChart');
    if (!ctx) {
      console.error('Returns chart canvas not found');
      return;
    }

    // Destroy existing chart if it exists
    if (window.returnsChart instanceof Chart) {
      window.returnsChart.destroy();
    }

    // Show loading state
    ctx.style.display = 'none';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'chart-loading';
    loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading returns data...';
    ctx.parentNode.appendChild(loadingDiv);

    // Fetch returns data
    fetch(`/returns?ticker=${ticker}&period=${period}`)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }

        // Remove loading state
        loadingDiv.remove();
        ctx.style.display = 'block';

        const dates = data.data.map(item => item.date);
        const returns = data.data.map(item => item.return);

        // Color bars based on positive/negative returns
        const colors = returns.map(ret => ret >= 0 ? 'rgba(75, 192, 75, 0.8)' : 'rgba(255, 99, 132, 0.8)');

        window.returnsChart = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: dates,
            datasets: [{
              label: 'Daily Return (%)',
              data: returns,
              backgroundColor: colors,
              borderColor: colors.map(color => color.replace('0.8', '1')),
              borderWidth: 1,
              borderRadius: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: 'index'
            },
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Date'
                },
                ticks: {
                  maxTicksLimit: 15
                }
              },
              y: {
                display: true,
                title: {
                  display: true,
                  text: 'Return (%)'
                },
                ticks: {
                  callback: function(value) {
                    return value.toFixed(2) + '%';
                  }
                }
              }
            },
            plugins: {
              title: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return 'Return: ' + context.parsed.y.toFixed(2) + '%';
                  }
                }
              }
            }
          }
        });
      })
      .catch(error => {
        console.error('Error loading returns data:', error);
        loadingDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Error loading data';
      });
  } catch (error) {
    console.error('Error initializing returns chart:', error);
  }
}

// Initialize Beta Calculation
function initializeBetaCalculation(ticker) {
  try {
    const betaContainer = document.querySelector('.beta-container');
    if (!betaContainer) {
      console.error('Beta container not found');
      return;
    }

    // Fetch beta data
    fetch(`/beta?ticker=${ticker}&period=1y`)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }

        const riskClass = data.risk_level.toLowerCase();
        const riskColor = riskClass === 'high' ? '#ff6b6b' : riskClass === 'medium' ? '#ffd93d' : '#6bcf7f';

        betaContainer.innerHTML = `
          <div class="beta-metrics">
            <div class="beta-item">
              <div class="beta-label">Beta Value</div>
              <div class="beta-value" style="color: ${riskColor}">${data.beta}</div>
              <div class="beta-description">
                ${data.beta > 1 ? 'More volatile than market' : data.beta < 1 ? 'Less volatile than market' : 'Same volatility as market'}
              </div>
            </div>
            <div class="beta-item">
              <div class="beta-label">Risk Level</div>
              <div class="beta-value" style="color: ${riskColor}">${data.risk_level}</div>
              <div class="beta-description">
                Based on beta volatility
              </div>
            </div>
            <div class="beta-item">
              <div class="beta-label">Annualized Volatility</div>
              <div class="beta-value">${data.annualized_volatility}%</div>
              <div class="beta-description">
                Annualized standard deviation of daily returns
              </div>
            </div>
          </div>
        `;
      })
      .catch(error => {
        console.error('Error loading beta data:', error);
        betaContainer.innerHTML = `
          <div class="beta-error">
            <i class="fas fa-exclamation-triangle"></i>
            Error calculating beta: ${error.message}
          </div>
        `;
      });
  } catch (error) {
    console.error('Error initializing beta calculation:', error);
  }
}

function displayRiskMetrics(company) {
  try {
    const betaContainer = document.querySelector('.beta-container');
    if (!betaContainer) {
      console.error('Beta container not found');
      return;
    }

    // Get beta value from company data
    const beta = company.beta;
    if (beta === null || beta === undefined || beta === 'N/A') {
      betaContainer.innerHTML = `
        <div class="beta-error">
          <i class="fas fa-exclamation-triangle"></i>
          Beta data not available for this stock
        </div>
      `;
      return;
    }

    // Determine risk level based on beta
    let riskLevel, riskColor, riskDescription;
    if (beta > 1.5) {
      riskLevel = 'High';
      riskColor = '#ff6b6b';
      riskDescription = 'Significantly more volatile than market';
    } else if (beta > 0.8) {
      riskLevel = 'Medium';
      riskColor = '#ffd93d';
      riskDescription = 'Moderately volatile compared to market';
    } else {
      riskLevel = 'Low';
      riskColor = '#6bcf7f';
      riskDescription = 'Less volatile than market';
    }

    // Get additional risk metrics
    const trailingPE = company.trailing_pe;
    const forwardPE = company.forward_pe;
    const pegRatio = company.peg_ratio;
    const annualizedVolatility = company.annualized_volatility;
    const atr14d = company.atr_14d;
    const hv30d = company.hv_30d;

    betaContainer.innerHTML = `
      <div class="beta-metrics">
        <div class="beta-item">
          <div class="beta-label">Beta Value</div>
          <div class="beta-value" style="color: ${riskColor}">${beta.toFixed(2)}</div>
          <div class="beta-description">
            ${beta > 1 ? 'More volatile than market' : beta < 1 ? 'Less volatile than market' : 'Same volatility as market'}
          </div>
        </div>
        <div class="beta-item">
          <div class="beta-label">Risk Level</div>
          <div class="beta-value" style="color: ${riskColor}">${riskLevel}</div>
          <div class="beta-description">
            ${riskDescription}
          </div>
        </div>
        <div class="beta-item">
          <div class="beta-label">Annualized Volatility</div>
          <div class="beta-value">${annualizedVolatility !== undefined ? annualizedVolatility + '%' : 'N/A'}</div>
          <div class="beta-description">
            Annualized standard deviation of daily returns
          </div>
        </div>
        <div class="beta-item">
          <div class="beta-label">ATR (14-day)</div>
          <div class="beta-value">${atr14d !== undefined && atr14d !== null ? atr14d : 'N/A'}</div>
          <div class="beta-description">
            Average True Range (14 days): typical daily price movement
          </div>
        </div>
        <div class="beta-item">
          <div class="beta-label">Historical Volatility (30-day)</div>
          <div class="beta-value">${hv30d !== undefined && hv30d !== null ? hv30d + '%' : 'N/A'}</div>
          <div class="beta-description">
            30-day standard deviation of daily returns (not annualized)
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error displaying risk metrics:', error);
    const betaContainer = document.querySelector('.beta-container');
    if (betaContainer) {
      betaContainer.innerHTML = `
        <div class="beta-error">
          <i class="fas fa-exclamation-triangle"></i>
          Error displaying risk metrics: ${error.message}
        </div>
      `;
    }
  }
}

// Handle timeframe button clicks
function initializeTimeframeButtons() {
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('timeframe-btn')) {
      const button = e.target;
      const chartSection = button.closest('.chart-section');
      const period = button.dataset.period;
      
      // Update active button
      chartSection.querySelectorAll('.timeframe-btn').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Get current ticker from the page
      const currentTicker = document.getElementById('ticker').value;
      if (!currentTicker) return;
      
      // Determine which chart to update
      if (chartSection.querySelector('#priceHistoryChart')) {
        initializePriceHistoryChart(currentTicker, period);
      } else if (chartSection.querySelector('#returnsChart')) {
        initializeReturnsChart(currentTicker, period);
      }
    }
  });
}

function createCompanyOutlook(company, stock) {
  // Clean up company name by removing class suffixes
  const cleanName = company.name ? company.name.replace(/ - Class [A-Z]$/, '') : 'N/A';

  // Format the description with proper line breaks
  const formattedDescription = company.description
    ? company.description.replace(/\. /g, '. ').trim()
    : '<span class="na-value">No description available</span>';

  // Try all possible fields for each key detail
  const industry = company.industry || stock.industry || company.industryCode || 'N/A';
  const sector = company.sector || stock.sector || company.sectorCode || 'N/A';
  const website = company.website || company.url || 'N/A';
  const exchange = company.exchangeCode || company.exchange || 'N/A';

  // Format market cap using the new field from DefeatBeta
  const marketCap = company.market_cap ? formatNumber(company.market_cap) : 'N/A';
  
  // Format full time employees with commas
  const fullTimeEmployees = company.full_time_employees ? company.full_time_employees.toLocaleString() : 'N/A';
  
  // Format enterprise value
  const enterpriseValue = company.enterprise_value ? formatNumber(company.enterprise_value) : 'N/A';
  
  // Format shares outstanding
  const sharesOutstanding = company.shares_outstanding ? formatNumber(company.shares_outstanding) : 'N/A';
  
  // Format beta
  const beta = company.beta ? company.beta.toFixed(2) : 'N/A';
  
  // Format P/E ratios
  const trailingPE = company.trailing_pe ? company.trailing_pe.toFixed(2) : 'N/A';
  const forwardPE = company.forward_pe ? company.forward_pe.toFixed(2) : 'N/A';
  
  // Format EPS
  const trailingEPS = company.trailing_eps ? formatCurrency(company.trailing_eps) : 'N/A';
  const forwardEPS = company.forward_eps ? formatCurrency(company.forward_eps) : 'N/A';
  
  // Format PEG ratio
  const pegRatio = company.peg_ratio ? company.peg_ratio.toFixed(2) : 'N/A';

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
                <th>Start Date</th>
                <td>${company.startDate || '<span class="na-value">N/A</span>'}</td>
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
                <th>Full Time Employees</th>
                <td>${fullTimeEmployees}</td>
              </tr>
              <tr>
                <th>Market Cap</th>
                <td>${marketCap}</td>
              </tr>
              <tr>
                <th>Enterprise Value</th>
                <td>${enterpriseValue}</td>
              </tr>
              <tr>
                <th>Shares Outstanding</th>
                <td>${sharesOutstanding}</td>
              </tr>
              <tr>
                <th>Beta</th>
                <td>${beta}</td>
              </tr>
              <tr>
                <th>Trailing P/E</th>
                <td>${trailingPE}</td>
              </tr>
              <tr>
                <th>Forward P/E</th>
                <td>${forwardPE}</td>
              </tr>
              <tr>
                <th>Trailing EPS</th>
                <td>${trailingEPS}</td>
              </tr>
              <tr>
                <th>Forward EPS</th>
                <td>${forwardEPS}</td>
              </tr>
              <tr>
                <th>PEG Ratio</th>
                <td>${pegRatio}</td>
              </tr>
              <tr>
                <th>Website</th>
                <td>${website !== 'N/A' ? `<a href="${website}" target="_blank">${website}</a>` : 'N/A'}</td>
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
    showError('Please enter a ticker symbol');
    return;
  }

  setLoading(true);
  errorMessage.style.display = 'none';

  try {
    const response = await fetch(`/search?ticker=${ticker}`);
    const data = await response.json();

    if (response.ok) {
      resultBox.style.display = 'block';
      document.getElementById('outlook').innerHTML = createCompanyOutlook(data.company, data.stock);
      document.getElementById('summary').innerHTML = createStockSummary(data.stock);
      
      // Wait for the DOM to update before initializing the chart
      setTimeout(() => {
        initializePriceHistoryChart(ticker);
        initializeReturnsChart(ticker);
        displayRiskMetrics(data.company);
        initializeTimeframeButtons();
      }, 100);
      
      document.getElementById('history').innerHTML = createHistoryList([]);
      await loadHistory();
    } else {
      showError(data.error || 'Failed to fetch stock data');
    }
  } catch (error) {
    showError('An error occurred while fetching data');
    console.error('Error:', error);
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
    // Show success message
    const msg = document.createElement('div');
    msg.style.position = 'fixed';
    msg.style.top = '20px';
    msg.style.right = '20px';
    msg.style.padding = '10px 20px';
    msg.style.backgroundColor = 'var(--success-color)';
    msg.style.color = 'white';
    msg.style.borderRadius = '4px';
    msg.style.zIndex = '1000';
    msg.textContent = `${ticker} added to watchlist`;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
  }
}

function removeFromWatchlist(ticker) {
  let list = getWatchlist();
  list = list.filter(t => t !== ticker);
  setWatchlist(list);
  renderWatchlist();
}

function renderWatchlist() {
  const list = getWatchlist();
  const ul = document.getElementById('watchlist');
  if (!ul) return;
  
  ul.innerHTML = '';
  if (list.length === 0) {
    ul.innerHTML = '<li style="color:var(--text-secondary);font-style:italic;">No stocks saved.</li>';
    return;
  }
  
  list.forEach(ticker => {
    const li = document.createElement('li');
    li.className = 'watchlist-item';
    li.innerHTML = `
      <span class="ticker" style="cursor:pointer;">${ticker}</span>
      <button class="remove-watchlist" style="background:none;border:none;color:var(--error-color);font-size:1.1rem;cursor:pointer;">&times;</button>
    `;
    
    li.querySelector('.ticker').onclick = () => {
      tickerInput.value = ticker;
      stockForm.dispatchEvent(new Event('submit'));
    };
    
    li.querySelector('.remove-watchlist').onclick = () => removeFromWatchlist(ticker);
    ul.appendChild(li);
  });
}

// Add event listener for the watchlist button
document.addEventListener('DOMContentLoaded', function() {
  const addToWatchlistBtn = document.getElementById('addToWatchlistBtn');
  if (addToWatchlistBtn) {
    addToWatchlistBtn.onclick = function() {
      const ticker = tickerInput.value.trim().toUpperCase();
      if (ticker) {
        addToWatchlist(ticker);
      }
    };
  }
  
  // Initial render of watchlist
  renderWatchlist();
});

// --- Notes/Tags Feature ---
function getStockNotes() {
  const notes = localStorage.getItem('stockNotes');
  return notes ? JSON.parse(notes) : {};
}

function setStockNotes(notesObj) {
  localStorage.setItem('stockNotes', JSON.stringify(notesObj));
}

function getNoteForTicker(ticker) {
  const notes = getStockNotes();
  return notes[ticker] || [];
}

function saveNoteForTicker(ticker, note) {
  const notes = getStockNotes();
  if (!notes[ticker]) {
    notes[ticker] = [];
  }
  notes[ticker].push(note);
  setStockNotes(notes);
}

function deleteNoteForTicker(ticker, index) {
  const notes = getStockNotes();
  if (notes[ticker]) {
    notes[ticker].splice(index, 1);
    if (notes[ticker].length === 0) {
      delete notes[ticker];
    }
    setStockNotes(notes);
  }
}

function renderNotesSection(ticker) {
  const notes = getStockNotes();
  const tickerNotes = notes[ticker] || [];
  
  if (tickerNotes.length === 0) {
    notesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-sticky-note"></i>
        <p>No notes yet. Click the + button to add a note.</p>
      </div>
    `;
    return;
  }

  notesContainer.innerHTML = tickerNotes.map((note, index) => `
    <div class="note-item">
      <div class="note-header">
        <h4 class="note-title">${note.title}</h4>
        <span class="note-date">${formatTimestamp(note.timestamp)}</span>
      </div>
      <div class="note-content">${note.content}</div>
      <button class="delete-note" data-index="${index}" title="Delete note">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');

  // Add event listeners to delete buttons
  notesContainer.querySelectorAll('.delete-note').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.closest('.delete-note').dataset.index);
      deleteNoteForTicker(ticker, index);
      renderNotesSection(ticker);
    });
  });
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
      ${companies.map(c => `<td>$${c.stock.last_close?.toFixed(2) || 'N/A'}</td>`).join('')}
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

// Initialize all UI elements
function initializeUI() {
  ensureComparisonButton();
  ensurePortfolioButton();
  ensureSidebarToggle();
  
  // Add calculator button click handler
  const calculatorBtn = document.getElementById('calculatorBtn');
  if (calculatorBtn) {
    calculatorBtn.onclick = renderPerformanceCalculator;
  }
}

// Call initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeUI);

function renderPerformanceCalculator() {
  let modal = document.getElementById('performanceCalculator');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'performanceCalculator';
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
      <h2 style="margin-bottom:1.5rem;">Performance Calculator</h2>
      
      <div class="calculator-section">
        <h3>Return Calculator</h3>
        <div class="calculator-input-group">
          <div class="calculator-input">
            <label for="entryPrice">Entry Price ($)</label>
            <input type="number" id="entryPrice" min="0" step="0.01" placeholder="0.00" />
          </div>
          <div class="calculator-input">
            <label for="currentPrice">Current Price ($)</label>
            <input type="number" id="currentPrice" min="0" step="0.01" placeholder="0.00" />
          </div>
          <div class="calculator-input">
            <label for="shares">Number of Shares</label>
            <input type="number" id="shares" min="1" step="1" placeholder="1" />
          </div>
        </div>
        <div class="calculator-result" id="returnResult" style="display:none;">
          <h4>Return Analysis</h4>
          <div class="value" id="returnValue"></div>
          <div class="detail" id="returnDetail"></div>
        </div>
      </div>

      <div class="calculator-section">
        <h3>Annualized Return</h3>
        <div class="calculator-input-group">
          <div class="calculator-input">
            <label for="startDate">Start Date</label>
            <input type="date" id="startDate" />
          </div>
          <div class="calculator-input">
            <label for="endDate">End Date</label>
            <input type="date" id="endDate" />
          </div>
        </div>
        <div class="calculator-result" id="annualizedResult" style="display:none;">
          <h4>Annualized Return</h4>
          <div class="value" id="annualizedValue"></div>
          <div class="detail" id="annualizedDetail"></div>
        </div>
      </div>

      <div class="calculator-section">
        <h3>Breakeven Analysis</h3>
        <div class="calculator-input-group">
          <div class="calculator-input">
            <label for="entryPriceBE">Entry Price ($)</label>
            <input type="number" id="entryPriceBE" min="0" step="0.01" placeholder="0.00" />
          </div>
          <div class="calculator-input">
            <label for="sharesBE">Number of Shares</label>
            <input type="number" id="sharesBE" min="1" step="1" placeholder="1" />
          </div>
          <div class="calculator-input">
            <label for="fees">Fees/Slippage (%)</label>
            <input type="number" id="fees" min="0" step="0.01" placeholder="0.00" />
          </div>
        </div>
        <div class="calculator-result" id="breakevenResult" style="display:none;">
          <h4>Breakeven Price</h4>
          <div class="value" id="breakevenValue"></div>
          <div class="detail" id="breakevenDetail"></div>
        </div>
      </div>

      <button onclick="document.getElementById('performanceCalculator').remove();" class="btn-secondary" style="width:100%;">Close</button>
    </div>
  `;

  // Attach event listeners
  setTimeout(() => {
    // Return Calculator
    const returnInputs = ['entryPrice', 'currentPrice', 'shares'];
    returnInputs.forEach(id => {
      document.getElementById(id).addEventListener('input', calculateReturn);
    });

    // Annualized Return
    const annualizedInputs = ['startDate', 'endDate'];
    annualizedInputs.forEach(id => {
      document.getElementById(id).addEventListener('change', calculateAnnualizedReturn);
    });

    // Breakeven Analysis
    const breakevenInputs = ['entryPriceBE', 'sharesBE', 'fees'];
    breakevenInputs.forEach(id => {
      document.getElementById(id).addEventListener('input', calculateBreakeven);
    });
  }, 100);
}

function calculateReturn() {
  const entryPrice = parseFloat(document.getElementById('entryPrice').value) || 0;
  const currentPrice = parseFloat(document.getElementById('currentPrice').value) || 0;
  const shares = parseInt(document.getElementById('shares').value) || 0;

  if (entryPrice && currentPrice && shares) {
    const totalReturn = ((currentPrice - entryPrice) / entryPrice) * 100;
    const absoluteReturn = (currentPrice - entryPrice) * shares;
    
    const resultDiv = document.getElementById('returnResult');
    const valueDiv = document.getElementById('returnValue');
    const detailDiv = document.getElementById('returnDetail');
    
    resultDiv.style.display = 'block';
    valueDiv.textContent = `${totalReturn.toFixed(2)}%`;
    valueDiv.className = `value ${totalReturn >= 0 ? 'positive' : 'negative'}`;
    detailDiv.textContent = `Absolute Return: ${formatCurrency(absoluteReturn)}`;
  } else {
    document.getElementById('returnResult').style.display = 'none';
  }
}

function calculateAnnualizedReturn() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  const entryPrice = parseFloat(document.getElementById('entryPrice').value) || 0;
  const currentPrice = parseFloat(document.getElementById('currentPrice').value) || 0;

  if (startDate && endDate && entryPrice && currentPrice) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const years = (end - start) / (1000 * 60 * 60 * 24 * 365);
    
    if (years > 0) {
      const totalReturn = (currentPrice - entryPrice) / entryPrice;
      const annualizedReturn = (Math.pow(1 + totalReturn, 1 / years) - 1) * 100;
      
      const resultDiv = document.getElementById('annualizedResult');
      const valueDiv = document.getElementById('annualizedValue');
      const detailDiv = document.getElementById('annualizedDetail');
      
      resultDiv.style.display = 'block';
      valueDiv.textContent = `${annualizedReturn.toFixed(2)}%`;
      valueDiv.className = `value ${annualizedReturn >= 0 ? 'positive' : 'negative'}`;
      detailDiv.textContent = `Holding Period: ${years.toFixed(2)} years`;
    }
  } else {
    document.getElementById('annualizedResult').style.display = 'none';
  }
}

function calculateBreakeven() {
  const entryPrice = parseFloat(document.getElementById('entryPriceBE').value) || 0;
  const shares = parseInt(document.getElementById('sharesBE').value) || 0;
  const fees = parseFloat(document.getElementById('fees').value) || 0;

  if (entryPrice && shares && fees) {
    const totalCost = entryPrice * shares;
    const feeAmount = totalCost * (fees / 100);
    const breakevenPrice = (totalCost + feeAmount) / shares;
    
    const resultDiv = document.getElementById('breakevenResult');
    const valueDiv = document.getElementById('breakevenValue');
    const detailDiv = document.getElementById('breakevenDetail');
    
    resultDiv.style.display = 'block';
    valueDiv.textContent = formatCurrency(breakevenPrice);
    valueDiv.className = 'value';
    detailDiv.textContent = `Total Fees: ${formatCurrency(feeAmount)}`;
  } else {
    document.getElementById('breakevenResult').style.display = 'none';
  }
}

// Note handling
const addNoteBtn = document.getElementById('addNoteBtn');
const notesContainer = document.getElementById('notesContainer');

addNoteBtn.addEventListener('click', () => {
  const currentTicker = tickerInput.value.trim();
  if (!currentTicker) {
    showError('Please search for a stock first before adding a note');
    return;
  }

  // Create and show the note modal
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Add Note for ${currentTicker}</h3>
        <button class="close-modal"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="noteTitle">Title</label>
          <input type="text" id="noteTitle" placeholder="Enter note title" class="form-input">
        </div>
        <div class="form-group">
          <label for="noteContent">Note</label>
          <textarea id="noteContent" placeholder="Enter your note" class="form-input" rows="4"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary close-modal">Cancel</button>
        <button class="btn-primary" id="saveNoteBtn">Save Note</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Add event listeners for the modal
  const closeModal = () => {
    modal.remove();
  };

  modal.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  modal.querySelector('#saveNoteBtn').addEventListener('click', () => {
    const title = modal.querySelector('#noteTitle').value.trim();
    const content = modal.querySelector('#noteContent').value.trim();

    if (!title || !content) {
      showError('Please enter both title and note content');
      return;
    }

    const note = {
      title,
      content,
      timestamp: new Date().toISOString()
    };

    saveNoteForTicker(currentTicker, note);
    renderNotesSection(currentTicker);
    closeModal();
  });
});

function renderNotesSection(ticker) {
  const notes = getStockNotes();
  const tickerNotes = notes[ticker] || [];
  
  if (tickerNotes.length === 0) {
    notesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-sticky-note"></i>
        <p>No notes yet. Click the + button to add a note.</p>
      </div>
    `;
    return;
  }

  notesContainer.innerHTML = tickerNotes.map((note, index) => `
    <div class="note-item">
      <div class="note-header">
        <h4 class="note-title">${note.title}</h4>
        <span class="note-date">${formatTimestamp(note.timestamp)}</span>
      </div>
      <div class="note-content">${note.content}</div>
      <button class="delete-note" data-index="${index}" title="Delete note">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');

  // Add event listeners to delete buttons
  notesContainer.querySelectorAll('.delete-note').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = parseInt(e.target.closest('.delete-note').dataset.index);
      deleteNoteForTicker(ticker, index);
      renderNotesSection(ticker);
    });
  });
}