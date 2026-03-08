// js/storage.js
// Shared module for LocalStorage, Constants, and helper logic

const STORAGE_KEY = 'smart_transactions';

const CATEGORIES = {
    expense: ['Food', 'Travel', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Education', 'Recharge', 'Others'],
    income: ['Salary', 'Freelance', 'Investments', 'Gift', 'Self Transfer', 'Others']
};

function clearAllData() {
    localStorage.removeItem(STORAGE_KEY);
}

// Data Retrieval & Saving
function getTransactions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Helpers
function addTransaction(tx) {
    const transactions = getTransactions();
    transactions.push(tx);
    saveTransactions(transactions);
}

function deleteTransaction(id) {
    let transactions = getTransactions();
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions(transactions);
}

function formatCurrency(amount) {
    return `₹${amount.toLocaleString('en-IN')}`;
}

function getMonthYearStr(dateString) {
    const d = new Date(dateString);
    let month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${d.getFullYear()}-${month}`; 
}

function formatMonthYearDisplay(YYYY_MM) {
    if(!YYYY_MM) return '';
    const [year, month] = YYYY_MM.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// Ensure global scope access across files
window.StorageModule = {
    CATEGORIES,
    getTransactions,
    saveTransactions,
    addTransaction,
    deleteTransaction,
    clearAllData,
    formatCurrency,
    getMonthYearStr,
    formatMonthYearDisplay
};
