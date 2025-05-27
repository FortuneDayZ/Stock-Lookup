// -----------------------------------------------------------
// Initialization: Get references to all key DOM elements
// -----------------------------------------------------------

const form = document.getElementById('stockForm');
const tickerInput = document.getElementById('ticker');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');
const resultBox = document.getElementById('resultBox');
const errorMessage = document.getElementById('errorMessage');

// -----------------------------------------------------------
// Event: Handle form submission and perform stock search
// -----------------------------------------------------------

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validate ticker input
  if (!tickerInput.checkValidity()) {
    tickerInput.reportValidity();
    return;
  }

  const ticker = tickerInput.value.trim().toUpperCase();

  try {
    // -----------------------------------------------------------
    // Step 1: Send search request to backend
    // -----------------------------------------------------------
    const res = await fetch(`/search?ticker=${ticker}`);
    const data = await res.json();

    // -----------------------------------------------------------
    // Step 2: Handle error response
    // -----------------------------------------------------------
    if (data.error) {
      resultBox.style.display = "none";
      errorMessage.innerText = `Error : ${data.error}`;
      return;
    } else {
      errorMessage.innerText = '';
      resultBox.style.display = "block";
      searchBtn.style.border = '2px solid black';
    }

    // -----------------------------------------------------------
    // Step 3: Populate Company Outlook tab
    // -----------------------------------------------------------
    document.getElementById('outlook').innerHTML = `
      <table>
        <tr><th>Company Name</th><td>${data.company.name.replace(/ - Class [A-Z]$/, '')}</td></tr>
        <tr><th>Stock Ticker Symbol</th><td>${data.company.ticker}</td></tr>
        <tr><th>Exchange Code</th><td>${data.company.exchangeCode}</td></tr>
        <tr><th>Start Date</th><td>${data.company.startDate}</td></tr>
        <tr><th>Description</th><td class="description">${data.company.description}</td></tr>
      </table>
    `;

    // -----------------------------------------------------------
    // Step 4: Extract stock data with fallback defaults
    // -----------------------------------------------------------
    const stock = data.stock;
    const last = stock.last ?? "N/A";
    const prevClose = stock.prevClose ?? "N/A";
    const open = stock.open ?? "N/A";
    const high = stock.high ?? "N/A";
    const low = stock.low ?? "N/A";
    const volume = stock.volume ?? "N/A";
    const tradingDay = stock.timestamp ? stock.timestamp.split("T")[0] : "N/A";
    const change = stock.change ?? "N/A";
    const changePercent = stock.change_percent ?? "N/A";

    // -----------------------------------------------------------
    // Step 5: Determine change arrow icon based on price movement
    // -----------------------------------------------------------
    let changeArrow = '';
    if (typeof change === 'number' && change > 0) {
      changeArrow = "<img class='arrow' src='/static/GreenArrowUP.png' alt='up'>";
    } else if (typeof change === 'number' && change < 0) {
      changeArrow = "<img class='arrow' src='/static/RedArrowDown.png' alt='down'>";
    }

    // -----------------------------------------------------------
    // Step 6: Populate Stock Summary tab
    // -----------------------------------------------------------
    document.getElementById('summary').innerHTML = `
      <table>
        <tr><th>Stock Ticker Symbol</th><td>${stock.ticker}</td></tr>
        <tr><th>Trading Day</th><td>${tradingDay}</td></tr>
        <tr><th>Previous Closing Price</th><td>${prevClose}</td></tr>
        <tr><th>Opening Price</th><td>${open}</td></tr>
        <tr><th>High Price</th><td>${high}</td></tr>
        <tr><th>Low Price</th><td>${low}</td></tr>
        <tr><th>Last Price</th><td>${last}</td></tr>
        <tr><th>Change</th><td>${change} ${changeArrow}</td></tr>
        <tr><th>Change Percent</th><td>${changePercent === "N/A" ? "N/A" : changePercent + "%"} ${changeArrow}</td></tr>
        <tr><th>Number of Shares Traded</th><td>${volume}</td></tr>
      </table>
    `;

    // -----------------------------------------------------------
    // Step 7: Fetch and populate Search History tab
    // -----------------------------------------------------------
    const historyRes = await fetch('/history');
    const history = await historyRes.json();
    let rows = history.map(entry =>
      `<tr><td>${entry.ticker}</td><td>${entry.timestamp}</td></tr>`
    ).join('');
    document.getElementById('history').innerHTML = `
      <table>
        <tr><th>Ticker</th><th>Timestamp</th></tr>
        ${rows}
      </table>
    `;
  } catch (err) {
    // -----------------------------------------------------------
    // Step 8: Handle network or server error
    // -----------------------------------------------------------
    resultBox.style.display = "none";
    errorMessage.innerText = 'Error fetching data.';
  }
});

// -----------------------------------------------------------
// Event: Clear button resets all results and UI state
// -----------------------------------------------------------

clearBtn.addEventListener('click', () => {
  tickerInput.value = '';
  document.getElementById('outlook').innerHTML = '';
  document.getElementById('summary').innerHTML = '';
  document.getElementById('history').innerHTML = '';
  errorMessage.innerText = '';
  searchBtn.style.border = 'none';
  resultBox.style.display = 'none';
});

// -----------------------------------------------------------
// Event: Handle tab switching for result sections
// -----------------------------------------------------------

tabs.forEach(btn => {
  btn.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});