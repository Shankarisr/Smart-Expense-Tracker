// js/charts.js
// Mobile Pie Chart logic

document.addEventListener('DOMContentLoaded', () => {
    const { getTransactions, getMonthYearStr, formatMonthYearDisplay, formatCurrency } = window.StorageModule;

    const monthSelector = document.getElementById('month-selector');
    const ctx = document.getElementById('expense-pie-chart').getContext('2d');
    const noDataMsg = document.getElementById('no-data-msg');
    let expenseChart = null;

    let selectedMonthYear = getMonthYearStr(new Date().toISOString().split('T')[0]);

    function init() {
        populateMonthSelector();

        monthSelector.addEventListener('change', (e) => {
            selectedMonthYear = e.target.value;
            renderReports();
        });

        renderReports();
    }

    function populateMonthSelector() {
        const transactions = getTransactions();
        const months = new Set();
        transactions.forEach(t => months.add(t.monthYear));
        months.add(selectedMonthYear); // Ensure current month is always there

        const sorted = Array.from(months).sort().reverse();
        monthSelector.innerHTML = sorted.map(m => `<option value="${m}">${formatMonthYearDisplay(m)}</option>`).join('');
        monthSelector.value = selectedMonthYear;
    }

    function renderReports() {
        const transactions = getTransactions().filter(t => t.monthYear === selectedMonthYear);
        
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryData = {};

        transactions.forEach(t => {
            if (t.type === 'income') {
                totalIncome += t.amount;
            } else if (t.type === 'expense') {
                totalExpense += t.amount;
                // Group by category string
                const catName = t.category.split(' - ')[0]; // group generalized "Others" if needed, or keep explicit. Let's keep explicit
                categoryData[t.category] = (categoryData[t.category] || 0) + t.amount;
            }
        });

        // Update Stats
        document.getElementById('stat-income').textContent = formatCurrency(totalIncome);
        document.getElementById('stat-expense').textContent = formatCurrency(totalExpense);
        document.getElementById('stat-count').textContent = transactions.length;

        // Find highest
        let maxCat = '-';
        let maxAmt = 0;
        for (const [cat, amt] of Object.entries(categoryData)) {
            if (amt > maxAmt) {
                maxAmt = amt;
                maxCat = cat;
            }
        }
        document.getElementById('stat-highest').textContent = maxAmt > 0 ? maxCat : '-';

        // Render Chart
        if (expenseChart) expenseChart.destroy();

        if (totalExpense > 0) {
            noDataMsg.classList.add('hidden');
            
            const labels = Object.keys(categoryData);
            const dataMap = Object.values(categoryData);

            // Generate some colors
            const colors = [
                '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
                '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
            ];

            expenseChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        data: dataMap,
                        backgroundColor: colors.slice(0, labels.length),
                        borderWidth: 2,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, font: {size: 11} } }
                    },
                    cutout: '70%'
                }
            });
        } else {
            noDataMsg.classList.remove('hidden');
        }
    }

    init();
});
