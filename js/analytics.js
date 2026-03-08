// js/analytics.js
// Logic for Daily Analytics page (analytics.html)

document.addEventListener('DOMContentLoaded', () => {
    const { 
        getTransactions, clearAllData, formatCurrency, getMonthYearStr, formatMonthYearDisplay 
    } = window.StorageModule;

    const monthSelector = document.getElementById('month-selector');
    const btnReset = document.getElementById('btn-reset');
    let selectedMonthYear = '';
    let barChartInstance = null;

    function init() {
        initChart();
        updateMonthSelector();
        
        monthSelector.addEventListener('change', (e) => {
            selectedMonthYear = e.target.value;
            updateAnalytics();
        });

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                showModal("Reset All Data", "Are you sure you want to delete all transactions? This cannot be undone.", () => {
                    clearAllData();
                    location.reload();
                });
            });
        }

        updateAnalytics();
    }

    function showModal(title, msg, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const titleEl = document.getElementById('modal-title');
        const descEl = document.getElementById('modal-desc');
        const btnCancel = document.getElementById('modal-cancel');
        const btnConfirm = document.getElementById('modal-confirm');

        titleEl.textContent = title;
        descEl.textContent = msg;
        modal.classList.add('active');

        // Cleanup previous listeners by cloning
        const newCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newCancel, btnCancel);
        const newConfirm = btnConfirm.cloneNode(true);
        btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);

        newCancel.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        newConfirm.addEventListener('click', () => {
            modal.classList.remove('active');
            if (onConfirm) onConfirm();
        });
    }

    function updateMonthSelector() {
        const transactions = getTransactions();
        const months = new Set();
        
        transactions.forEach(t => months.add(t.monthYear));
        
        const currentMonthYear = getMonthYearStr(new Date().toISOString().split('T')[0]);
        months.add(currentMonthYear); // Always show current month

        const sortedMonths = Array.from(months).sort().reverse();
        
        monthSelector.innerHTML = sortedMonths.map(m => 
            `<option value="${m}">${formatMonthYearDisplay(m)}</option>`
        ).join('');

        if (sortedMonths.length > 0 && !selectedMonthYear) {
            selectedMonthYear = currentMonthYear;
        }
        
        if(!sortedMonths.includes(selectedMonthYear)) {
            selectedMonthYear = sortedMonths[0];
        }

        monthSelector.value = selectedMonthYear;
    }

    function initChart() {
        const barCtx = document.getElementById('barChart').getContext('2d');
        Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
        Chart.defaults.color = "#64748b";

        barChartInstance = new Chart(barCtx, {
            type: 'bar',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ' ₹' + context.raw.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    function updateAnalytics() {
        const transactions = getTransactions();
        
        // Filter by month for expenses and recharges
        const monthData = transactions.filter(t => t.monthYear === selectedMonthYear && t.type !== 'income');
        
        const dailyTotals = {};
        let daysInMonth = 31; // fallback
        
        if(selectedMonthYear) {
            const [year, month] = selectedMonthYear.split('-');
            daysInMonth = new Date(year, month, 0).getDate(); // get actual days in that month
            
            for(let i=1; i<=daysInMonth; i++) {
                dailyTotals[i] = 0;
            }
        }

        // Populate actual spending data
        monthData.forEach(t => {
            dailyTotals[t.day] = (dailyTotals[t.day] || 0) + t.amount;
        });

        const barLabels = Object.keys(dailyTotals).map(d => `${d}`);
        const barData = Object.values(dailyTotals);

        // Find Maximum Spending Day
        let maxDayIndex = -1;
        let maxDayVal = -1;
        
        barData.forEach((val, idx) => {
            if(val > maxDayVal) {
                maxDayVal = val;
                maxDayIndex = idx;
            }
        });

        // Set colors (highlight highest dat)
        const bgColors = barData.map((v, i) => i === maxDayIndex && v > 0 ? '#4f46e5' : '#818cf8');

        // Check if there is data
        const hasData = barData.some(val => val > 0);
        
        if(hasData) {
            document.getElementById('no-data-msg').classList.add('hidden');
            document.getElementById('barChart').classList.remove('hidden');
        } else {
            document.getElementById('no-data-msg').classList.remove('hidden');
            document.getElementById('barChart').classList.add('hidden');
        }

        // Update High Day Highlights
        let maxDayText = '-';
        if(maxDayVal > 0 && selectedMonthYear) {
            const [y, m] = selectedMonthYear.split('-');
            const monthName = new Date(y, m-1).toLocaleString('default', {month:'short'});
            maxDayText = `${monthName} ${barLabels[maxDayIndex]} (${formatCurrency(maxDayVal)})`;
        }
        document.getElementById('high-day').textContent = maxDayText;

        // Update Average Spend
        let totalSpendMonth = barData.reduce((acc, curr) => acc + curr, 0);
        let average = totalSpendMonth / daysInMonth;
        document.getElementById('avg-spend').textContent = formatCurrency(Math.round(average));

        // Update Chart
        barChartInstance.data = {
            labels: barLabels,
            datasets: [{
                label: 'Spending',
                data: barData,
                backgroundColor: bgColors,
                borderRadius: 4
            }]
        };
        barChartInstance.update();
    }

    init();
});
