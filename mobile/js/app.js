// js/app.js
// Mobile Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
    const { 
        CATEGORIES, getTransactions, addTransaction, deleteTransaction, 
        formatCurrency, getMonthYearStr
    } = window.StorageModule;

    // Elements
    const form = document.getElementById('transaction-form');
    const typeSelect = document.getElementById('type');
    const categorySelect = document.getElementById('category');
    const otherGroup = document.getElementById('other-category-group');
    const otherInput = document.getElementById('other-category');
    const descInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const dateInput = document.getElementById('date');
    const timeInput = document.getElementById('time');
    
    const searchInput = document.getElementById('search');
    const txList = document.getElementById('transactions-list');
    const noDataDiv = document.getElementById('no-data');
    
    const fabButton = document.getElementById('btn-fab-add');
    const addModal = document.getElementById('add-modal');
    const btnModalClose = document.getElementById('btn-modal-close');
    const toast = document.getElementById('toast');
    const btnReset = document.getElementById('btn-reset');

    let currentMonthYear = getMonthYearStr(new Date().toISOString().split('T')[0]);

    function init() {
        setupFormDefaults();
        updateCategoryOptions();

        // Listeners
        typeSelect.addEventListener('change', updateCategoryOptions);
        categorySelect.addEventListener('change', handleCategoryChange);
        form.addEventListener('submit', handleFormSubmit);
        searchInput.addEventListener('input', renderList);

        // Modal Logic
        fabButton.addEventListener('click', () => {
            setupFormDefaults(); // reset to today
            // Enforce default type as expense and update categories
            typeSelect.value = 'expense';
            updateCategoryOptions();
            addModal.classList.add('active');
        });

        btnModalClose.addEventListener('click', () => {
            addModal.classList.remove('active');
            form.reset();
        });

        // Close modal on outside click
        addModal.addEventListener('click', (e) => {
            if (e.target === addModal) {
                addModal.classList.remove('active');
                form.reset();
            }
        });

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                showMobileConfirm("Reset All Data", "Are you sure you want to completely erase all transactions? This cannot be undone.", () => {
                    const { clearAllData } = window.StorageModule;
                    clearAllData();
                    location.reload();
                });
            });
        }

        updateDashboard();
        renderList();
    }

    function setupFormDefaults() {
        const d = new Date();
        dateInput.value = d.toISOString().split('T')[0];
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        timeInput.value = `${hh}:${min}`;
        otherGroup.classList.add('hidden');
    }

    function updateCategoryOptions() {
        const type = typeSelect.value;
        const options = CATEGORIES[type];
        categorySelect.innerHTML = options.map(c => `<option value="${c}">${c}</option>`).join('');
        handleCategoryChange();
    }

    function handleCategoryChange() {
        if (categorySelect.value === 'Others') {
            otherGroup.classList.remove('hidden');
        } else {
            otherGroup.classList.add('hidden');
            otherInput.value = '';
        }
    }

    function showMobileAlert(title, message, onOk) {
        const modal = document.getElementById('mobile-alert-modal');
        document.getElementById('mobile-alert-title').textContent = title;
        document.getElementById('mobile-alert-desc').textContent = message;
        
        const btnOk = document.getElementById('mobile-alert-ok');
        const newOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(newOk, btnOk);
        
        modal.classList.add('active');
        
        newOk.addEventListener('click', () => {
            modal.classList.remove('active');
            if (onOk) onOk();
        });
    }

    function showMobileConfirm(title, message, onConfirm) {
        const modal = document.getElementById('mobile-confirm-modal');
        document.getElementById('mobile-confirm-title').textContent = title;
        document.getElementById('mobile-confirm-desc').textContent = message;
        
        const btnCancel = document.getElementById('mobile-confirm-cancel');
        const btnConfirm = document.getElementById('mobile-confirm-ok');
        
        const newCancel = btnCancel.cloneNode(true);
        const newConfirm = btnConfirm.cloneNode(true);
        btnCancel.parentNode.replaceChild(newCancel, btnCancel);
        btnConfirm.parentNode.replaceChild(newConfirm, btnConfirm);
        
        modal.classList.add('active');
        
        newCancel.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        newConfirm.addEventListener('click', () => {
            modal.classList.remove('active');
            if (onConfirm) onConfirm();
        });
    }

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        
        const amount = parseFloat(amountInput.value);
        const type = typeSelect.value;
        let category = categorySelect.value;
        let desc = descInput.value.trim();
        const date = dateInput.value;
        const time = timeInput.value;

        // Validation & Defaults
        if (isNaN(amount) || amount <= 0) {
            showMobileAlert("Invalid Amount", "Please enter a valid amount greater than zero.");
            return;
        }

        if (category === 'Others' && otherInput.value.trim()) {
            category = `Others - ${otherInput.value.trim()}`;
            if (!desc) desc = otherInput.value.trim();
        }

        // Removed fallback logic so description stays blank if empty

        // Net Balance Check for Expenses
        if (type === 'expense') {
            const txs = getTransactions();
            const netBalance = txs.reduce((acc, curr) => {
                return acc + (curr.type === 'income' ? curr.amount : -curr.amount);
            }, 0);
            
            if (amount > netBalance) {
                showMobileAlert("Insufficient Balance", "Your current balance is not enough to cover this expense.");
                return;
            }
        }

        const dDate = new Date(`${date}T${time}`);
        
        const newTx = {
            id: Date.now().toString(),
            amount,
            type,
            category,
            description: desc,
            date,
            time, 
            monthYear: getMonthYearStr(date),
            month: dDate.getMonth() + 1,
            year: dDate.getFullYear(),
            day: dDate.getDate(),
            timestamp: dDate.getTime()
        };

        addTransaction(newTx);
        
        // Cleanup Modal
        form.reset();
        setupFormDefaults();
        addModal.classList.remove('active');
        showToast("Transaction Added!");

        updateDashboard();
        renderList();
    }

    // Global Delete Handler for HTML nodes
    window.handleMobileDelete = function(id) {
        showMobileConfirm("Delete Transaction", "Are you sure you want to delete this transaction?", () => {
            deleteTransaction(id);
            updateDashboard();
            renderList();
            showToast("Transaction Deleted");
        });
    }

    function updateDashboard() {
        const transactions = getTransactions();
        let totalIncome = 0;
        let totalExpense = 0;
        let monthIncome = 0;
        let monthExpense = 0;

        transactions.forEach(t => {
            // Overall
            if(t.type === 'income') totalIncome += t.amount;
            else if(t.type === 'expense') totalExpense += t.amount;
            
            // This Month
            if(t.monthYear === currentMonthYear) {
                if(t.type === 'income') monthIncome += t.amount;
                else if(t.type === 'expense') monthExpense += t.amount;
            }
        });

        const overallBalance = totalIncome - totalExpense;
        document.getElementById('card-balance').textContent = formatCurrency(overallBalance);
        document.getElementById('card-income').textContent = formatCurrency(monthIncome);
        document.getElementById('card-expense').textContent = formatCurrency(monthExpense);
    }

    function renderList() {
        let transactions = getTransactions();
        const q = searchInput.value.toLowerCase();
        
        if (q) {
            transactions = transactions.filter(t => 
                t.description.toLowerCase().includes(q) || 
                t.category.toLowerCase().includes(q)
            );
        }

        // Sort Newest First
        transactions.sort((a, b) => b.timestamp - a.timestamp);

        if(transactions.length === 0) {
            txList.innerHTML = '';
            noDataDiv.classList.remove('hidden');
        } else {
            noDataDiv.classList.add('hidden');
            txList.innerHTML = transactions.map(t => {
                let initial = t.category.charAt(0).toUpperCase();
                if (t.category.startsWith('Others - ')) {
                    initial = t.category.replace('Others - ', '').charAt(0).toUpperCase();
                }

                // Format: 08 Mar 11:38 AM
                const dateObj = new Date(t.timestamp);
                const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute:'2-digit', hour12: true });

                return `
                <div class="tx-card">
                    <div class="tx-avatar ${t.type}">${initial}</div>
                    <div class="tx-details">
                        <div class="tx-title">${t.category}</div>
                        <div class="tx-subtitle" style="font-weight: 500">${t.description}</div>
                        <div class="tx-subtitle" style="margin-top:2px;">${dateStr} ${timeStr} • ${t.type}</div>
                    </div>
                    <div class="tx-right">
                        <div class="tx-amount ${t.type}">${formatCurrency(t.amount)}</div>
                        <button class="btn-delete-mobile" onclick="window.handleMobileDelete('${t.id}')">Delete</button>
                    </div>
                </div>
                `;
            }).join('');
        }
    }

    init();
});
