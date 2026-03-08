// js/charts.js
// Logic for Monthly Reports page (reports.html)

document.addEventListener('DOMContentLoaded', () => {
    const { 
        getTransactions, clearAllData, formatCurrency, getMonthYearStr, formatMonthYearDisplay 
    } = window.StorageModule;

    const monthSelector = document.getElementById('month-selector');
    const btnReset = document.getElementById('btn-reset');
    let selectedMonthYear = '';
    let pieChartInstance = null;

    function init() {
        initChart();
        updateMonthSelector();
        
        monthSelector.addEventListener('change', (e) => {
            selectedMonthYear = e.target.value;
            updateReport();
        });

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                showModal("Reset All Data", "Are you sure you want to delete all transactions? This cannot be undone.", () => {
                    clearAllData();
                    location.reload();
                });
            });
        }

        updateReport();
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
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
        Chart.defaults.color = "#64748b";

        pieChartInstance = new Chart(pieCtx, {
            type: 'doughnut',
            data: { labels: [], datasets: [] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }

    function updateReport() {
        const transactions = getTransactions();
        
        // Filter by month
        const monthData = transactions.filter(t => t.monthYear === selectedMonthYear);
        
        // Summary calculations
        let totalSpent = 0;
        let txCount = monthData.length;

        monthData.forEach(t => {
            if(t.type === 'expense') {
                totalSpent += t.amount;
            }
        });

        document.getElementById('summary-spent').textContent = formatCurrency(totalSpent);
        document.getElementById('summary-count').textContent = txCount;

        // Chart calculations
        const chartData = monthData.filter(t => t.type !== 'income');
        const categoryTotals = {};
        
        chartData.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });

        const pieLabels = Object.keys(categoryTotals);
        const pieValues = Object.values(categoryTotals);

        // Update Highest Category
        let maxCatName = '-';
        if(pieLabels.length > 0) {
            let maxIndex = 0;
            for(let i=1; i<pieValues.length; i++) {
                if(pieValues[i] > pieValues[maxIndex]) maxIndex = i;
            }
            maxCatName = `${pieLabels[maxIndex]} (${formatCurrency(pieValues[maxIndex])})`;
            
            document.getElementById('no-data-msg').classList.add('hidden');
            document.getElementById('pieChart').classList.remove('hidden');
        } else {
            document.getElementById('no-data-msg').classList.remove('hidden');
            document.getElementById('pieChart').classList.add('hidden');
        }
        document.getElementById('summary-highest').textContent = maxCatName;

        // Update Chart
        pieChartInstance.data = {
            labels: pieLabels,
            datasets: [{
                data: pieValues,
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'],
                borderWidth: 1,
                borderColor: '#ffffff'
            }]
        };
        pieChartInstance.update();
    }

    init();
});
