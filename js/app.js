// js/app.js
// Logic for Dashboard page (index.html)

document.addEventListener('DOMContentLoaded', () => {
    const { 
        CATEGORIES, getTransactions, addTransaction, deleteTransaction, clearAllData,
        formatCurrency, getMonthYearStr, formatMonthYearDisplay
    } = window.StorageModule;

    const form = document.getElementById('transaction-form');
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    const otherCategoryGroup = document.getElementById('other-category-group');
    const otherCategoryInput = document.getElementById('other-category');
    const searchInput = document.getElementById('search');
    const monthSelector = document.getElementById('dashboard-month-selector');
    const btnReset = document.getElementById('btn-reset');

    let selectedMonthYear = '';

    function init() {
        // Set default date and time to today/now
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
        
        const hh = String(today.getHours()).padStart(2, '0');
        const min = String(today.getMinutes()).padStart(2, '0');
        timeInput.value = `${hh}:${min}`;

        updateCategoryOptions();

        typeSelect.addEventListener('change', updateCategoryOptions);
        categorySelect.addEventListener('change', handleCategoryChange);
        form.addEventListener('submit', handleAddTransaction);
        searchInput.addEventListener('input', renderTable);
        
        monthSelector.addEventListener('change', (e) => {
            selectedMonthYear = e.target.value;
            updateDashboard();
            renderTable();
        });

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                showModal("Reset All Data", "Are you sure you want to delete all transactions? This cannot be undone.", () => {
                    clearAllData();
                    location.reload();
                });
            });
        }

        updateMonthSelector();
        updateDashboard();
        renderTable();
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

    function showAlert(title, msg) {
        const modal = document.getElementById('alert-modal');
        const titleEl = document.getElementById('alert-title');
        const descEl = document.getElementById('alert-desc');
        const btnOk = document.getElementById('alert-ok');

        titleEl.textContent = title;
        descEl.textContent = msg;
        modal.classList.add('active');

        const newOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(newOk, btnOk);

        newOk.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    function updateCategoryOptions() {
        const type = typeSelect.value;
        const options = CATEGORIES[type];
        categorySelect.innerHTML = options.map(cat => `<option value="${cat}">${cat}</option>`).join('');
        handleCategoryChange();
    }

    function handleCategoryChange() {
        if (categorySelect.value === 'Others') {
            otherCategoryGroup.classList.remove('hidden');
        } else {
            otherCategoryGroup.classList.add('hidden');
            otherCategoryInput.value = '';
        }
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

    function handleAddTransaction(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('amount').value);
        const type = typeSelect.value;
        let category = categorySelect.value;
        const date = dateInput.value;
        const time = timeInput.value;
        
        let description = document.getElementById('description').value.trim();
    if (!description) {
        description = type === 'income' ? 'Income' : category; 
    }
    
    // If it's 'Others' and user typed something, update the category string
    if (category === 'Others' && otherCategoryInput.value.trim() !== '') {
        const specificOther = otherCategoryInput.value.trim();
        category = `Others - ${specificOther}`;
        // If the description fell back to 'Others', we arguably want it to just say the specific thing 
        // Or keep it as "Others". Let's update it to the specific thing for cleaner UI if that was the fallback.
        if (description === 'Others') {
            description = specificOther;
        }
    }    

        if(isNaN(amount) || amount <= 0) {
            showAlert("Invalid Amount", "Please enter a valid amount greater than 0.");
            return;
        }

        if (type === 'expense') {
            const transactions = getTransactions();
            let totalIncome = 0;
            let totalExpense = 0;
            transactions.forEach(t => {
                if(t.type === 'income') totalIncome += t.amount;
                else if(t.type === 'expense') totalExpense += t.amount;
            });
            const currentBalance = totalIncome - totalExpense;
            
            if (amount > currentBalance) {
                showAlert("Insufficient Balance", "Expense amount cannot be greater than the current balance.");
                return;
            }
        }

        const dDate = new Date(`${date}T${time}`);
        
        const newTx = {
            id: Date.now().toString(),
            amount,
            type,
            category,
            description,
            date,
            time, 
            monthYear: getMonthYearStr(date),
            month: dDate.getMonth() + 1,
            year: dDate.getFullYear(),
            day: dDate.getDate(),
            timestamp: dDate.getTime()
        };

        addTransaction(newTx);

        // Reset inputs
        document.getElementById('amount').value = '';
        document.getElementById('description').value = '';
        otherCategoryInput.value = '';
        otherCategoryGroup.classList.add('hidden');

        updateMonthSelector();
        updateDashboard();
        renderTable();
    }

    // Expose correctly to global object so onclick works in HTML
    window.handleDeleteTransaction = function(id) {
        showModal("Delete Transaction", "Are you sure you want to delete this transaction?", () => {
            deleteTransaction(id);
            updateMonthSelector();
            updateDashboard();
            renderTable();
        });
    };

    function updateDashboard() {
        const transactions = getTransactions();
        let totalIncome = 0;
        let totalExpense = 0;

        // Current overall balance
        transactions.forEach(t => {
            if(t.type === 'income') totalIncome += t.amount;
            else if(t.type === 'expense') totalExpense += t.amount;
        });

        const overallBalance = totalIncome - totalExpense;
        document.getElementById('card-balance').textContent = formatCurrency(overallBalance);

        // Current month totals based on selectedMonthYear
        let monthIncome = 0;
        let monthExpense = 0;
        
        const currentMonthData = transactions.filter(t => t.monthYear === selectedMonthYear);
        
        currentMonthData.forEach(t => {
            if(t.type === 'income') monthIncome += t.amount;
            else if(t.type === 'expense') monthExpense += t.amount;
        });

        document.getElementById('card-income').textContent = formatCurrency(monthIncome);
        document.getElementById('card-expense').textContent = formatCurrency(monthExpense);
    }

    function renderTable() {
        let transactions = getTransactions();
        // Since we changed the HTML container id to 'transactions-list' we update the reference
        const listContainer = document.getElementById('transactions-list');
        const noDataDiv = document.getElementById('no-data');
        const searchQuery = searchInput.value.toLowerCase();
        
        // Filter by month
        transactions = transactions.filter(t => t.monthYear === selectedMonthYear);

        if(searchQuery) {
            transactions = transactions.filter(t => 
                t.description.toLowerCase().includes(searchQuery) || 
                t.category.toLowerCase().includes(searchQuery)
            );
        }

        // Sort by timestamp if available or combine date and time strings - NEWEST FIRST
        transactions.sort((a, b) => {
            const timeA = a.timestamp || new Date(`${a.date}T${a.time || '00:00'}`).getTime();
            const timeB = b.timestamp || new Date(`${b.date}T${b.time || '00:00'}`).getTime();
            if (timeB === timeA) {
                // Fallback to creation ID if timestamps are perfectly identical
                return parseInt(b.id) - parseInt(a.id);
            }
            return timeB - timeA;
        });

        if(transactions.length === 0) {
            listContainer.innerHTML = '';
            noDataDiv.classList.remove('hidden');
        } else {
            noDataDiv.classList.add('hidden');
            listContainer.innerHTML = transactions.map(t => {
                const dateObj = new Date(`${t.date}T${t.time || '00:00'}`);
                const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ', ' + dateObj.toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'});
                const pSign = t.type === 'income' ? '+' : '-';
                
                // Get first letter of category for the avatar
                let initial = t.category.charAt(0).toUpperCase();
                if (t.category.startsWith('Others - ')) {
                    initial = t.category.replace('Others - ', '').charAt(0).toUpperCase();
                }

                return `
                <div class="tx-card">
                    <div class="tx-avatar ${t.type}">
                        ${initial}
                    </div>
                    <div class="tx-details">
                        <div class="tx-title">${t.category}</div>
                        <div class="tx-subtitle">${dateStr} • ${t.description}</div>
                    </div>
                    <div class="tx-right">
                        <div class="tx-amount ${t.type}">${pSign}₹${t.amount.toLocaleString('en-IN')}</div>
                        <button class="btn-delete-icon" onclick="window.handleDeleteTransaction('${t.id}')">
                            <span style="font-size: 1.2rem;">×</span>
                        </button>
                    </div>
                </div>
                `;
            }).join('');
        }
    }

    init();
});
