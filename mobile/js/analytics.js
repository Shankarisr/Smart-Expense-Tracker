// js/analytics.js
// Mobile Bar Chart logic

document.addEventListener('DOMContentLoaded', () => {
    const { getTransactions, getMonthYearStr, formatMonthYearDisplay, formatCurrency } = window.StorageModule;

    const monthSelector = document.getElementById('month-selector');
    const ctx = document.getElementById('daily-bar-chart').getContext('2d');
    const noDataMsg = document.getElementById('no-data-msg');
    let dailyChart = null;

    let selectedMonthYear = getMonthYearStr(new Date().toISOString().split('T')[0]);

    function init() {
        populateMonthSelector();

        monthSelector.addEventListener('change', (e) => {
            selectedMonthYear = e.target.value;
            renderAnalytics();
        });

        renderAnalytics();
    }

    function populateMonthSelector() {
        const transactions = getTransactions();
        const months = new Set();
        transactions.forEach(t => months.add(t.monthYear));
        months.add(selectedMonthYear);

        const sorted = Array.from(months).sort().reverse();
        monthSelector.innerHTML = sorted.map(m => `<option value="${m}">${formatMonthYearDisplay(m)}</option>`).join('');
        monthSelector.value = selectedMonthYear;
    }

    function renderAnalytics() {
        const transactions = getTransactions().filter(t => t.monthYear === selectedMonthYear && t.type === 'expense');

        const dailyData = {};
        let totalExpense = 0;

        // Group by day (date index 1 to 31)
        transactions.forEach(t => {
            const dayMatch = t.date.split('-')[2]; // Extract DD from YYYY-MM-DD
            if (dayMatch) {
                const day = parseInt(dayMatch, 10);
                dailyData[day] = (dailyData[day] || 0) + t.amount;
                totalExpense += t.amount;
            }
        });

        const sortedDays = Object.keys(dailyData).sort((a,b) => a - b);
        
        let maxDay = '-';
        let maxAmt = 0;
        const labels = [];
        const dataMap = [];

        sortedDays.forEach(day => {
            const amt = dailyData[day];
            labels.push(`Day ${day}`);
            dataMap.push(amt);
            
            if (amt > maxAmt) {
                maxAmt = amt;
                maxDay = `Day ${day} (₹${amt.toLocaleString()})`;
            }
        });

        const activeDaysCount = sortedDays.length;
        const avgSpend = activeDaysCount > 0 ? (totalExpense / activeDaysCount) : 0;

        document.getElementById('stat-avg').textContent = formatCurrency(Math.round(avgSpend));
        document.getElementById('stat-highest-day').textContent = maxDay;

        if (dailyChart) dailyChart.destroy();

        if (transactions.length > 0) {
            noDataMsg.classList.add('hidden');

            dailyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Daily Expense',
                        data: dataMap,
                        backgroundColor: '#ef4444', 
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        y: { beginAtZero: true, display: true }
                    }
                }
            });
        } else {
            noDataMsg.classList.remove('hidden');
        }
    }

    init();
});
