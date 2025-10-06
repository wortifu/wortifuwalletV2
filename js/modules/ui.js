import { AIInsightsManager } from './insights.js';

export class UIManager {
    constructor(transactionManager) {
        this.transactionManager = transactionManager;
        this.toast = document.getElementById('toast');
        this.currentPeriod = 'week';
        this.insightsManager = null;// Default period
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setCurrentDateTime();
        this.updateWeekRange();
        this.insightsManager = new AIInsightsManager(this.transactionManager);
    }

    setupEventListeners() {
        // Transaction form
        const transactionForm = document.getElementById('transactionForm');
        transactionForm.addEventListener('submit', (e) => this.handleTransactionSubmit(e));

        // Transaction type buttons
        const typeButtons = document.querySelectorAll('.type-btn');
        typeButtons.forEach(button => {
            button.addEventListener('click', () => this.handleTypeToggle(button));
        });

        // Period selector buttons
        const periodButtons = document.querySelectorAll('.period-btn');
        periodButtons.forEach(button => {
            button.addEventListener('click', () => this.handlePeriodChange(button));
        });

        // Edit transaction type radio buttons
        const editIncomeRadio = document.getElementById('editIncome');
        const editExpenseRadio = document.getElementById('editExpense');
        editIncomeRadio.addEventListener('change', () => this.handleEditTypeChange('income'));
        editExpenseRadio.addEventListener('change', () => this.handleEditTypeChange('expense'));

        // Pagination
        document.getElementById('prevBtn').addEventListener('click', () => this.handlePagination('prev'));
        document.getElementById('nextBtn').addEventListener('click', () => this.handlePagination('next'));

        // Clear all
        document.getElementById('clearAllBtn').addEventListener('click', () => this.showClearAllModal());

        // Modals
        this.setupModalListeners();

        // Import/Export
        document.getElementById('importBtn').addEventListener('click', () => this.showImportModal());
        document.getElementById('exportBtn').addEventListener('click', () => this.handleExport());

        // Balance cards
        document.querySelectorAll('.balance-card').forEach(card => {
            card.addEventListener('click', () => this.handleBalanceCardClick(card));
        });
    }

    handleTransactionSubmit(e) {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('amount').value);
        const description = document.getElementById('description').value;
        const datetime = document.getElementById('datetime').value;
        const type = document.querySelector('.type-btn.active').getAttribute('data-type');
        
        const transaction = {
            id: Date.now(),
            type: type,
            amount: amount,
            description: description,
            datetime: datetime
        };
        
        this.transactionManager.addTransaction(transaction);
        this.updateUI();
        this.resetForm();
        this.showToast('Transaction added successfully!');
    }

    handleTypeToggle(button) {
        const container = button.closest('.transaction-type');
        container.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        const submitBtn = document.getElementById('submitBtn');
        if (button.getAttribute('data-type') === 'expense') {
            submitBtn.classList.add('expense-submit');
        } else {
            submitBtn.classList.remove('expense-submit');
        }
    }

    handlePeriodChange(button) {
        // Remove active class from all period buttons
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Update current period
        this.currentPeriod = button.dataset.period;
        
        // Reset pagination to first page
        this.transactionManager.currentPage = 1;
        
        // Update week range display
        this.updateWeekRange();
        
        // Re-render transactions with new period filter
        this.renderTransactions();
        
        // Show toast notification
        this.showToast(`Showing ${this.currentPeriod} transactions`);
    }

    handleEditTypeChange(type) {
        // Edit type change handler
    }

    handlePagination(direction) {
        const filteredTransactions = this.getFilteredTransactions();
        const totalPages = Math.ceil(filteredTransactions.length / this.transactionManager.itemsPerPage);
        
        if (direction === 'prev' && this.transactionManager.currentPage > 1) {
            this.transactionManager.currentPage--;
        } else if (direction === 'next' && this.transactionManager.currentPage < totalPages) {
            this.transactionManager.currentPage++;
        }
        this.renderTransactions();
    }

    handleBalanceCardClick(card) {
        const title = card.querySelector('.balance-title').textContent;
        this.showToast(`Viewing ${title} details`);
    }

    setupModalListeners() {
        // Clear all modal
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('confirmModal').style.display = 'none';
        });
        document.getElementById('cancelBtn').addEventListener('click', () => {
            document.getElementById('confirmModal').style.display = 'none';
        });
        document.getElementById('confirmBtn').addEventListener('click', () => {
            this.transactionManager.clearAllTransactions();
            this.updateUI();
            document.getElementById('confirmModal').style.display = 'none';
            this.showToast('All transactions cleared successfully!');
        });

        // Delete modal
        document.getElementById('closeDeleteModal').addEventListener('click', () => {
            document.getElementById('deleteModal').style.display = 'none';
        });
        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            document.getElementById('deleteModal').style.display = 'none';
        });
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            const id = parseInt(document.getElementById('confirmDeleteBtn').dataset.id);
            if (this.transactionManager.deleteTransaction(id)) {
                this.updateUI();
                this.showToast('Transaction deleted successfully!');
            }
            document.getElementById('deleteModal').style.display = 'none';
        });

        // Edit modal
        document.getElementById('closeEditModal').addEventListener('click', () => {
            document.getElementById('editModal').style.display = 'none';
        });
        document.getElementById('cancelEditBtn').addEventListener('click', () => {
            document.getElementById('editModal').style.display = 'none';
        });
        document.getElementById('saveEditBtn').addEventListener('click', () => {
            this.handleEditSave();
        });

        // Import modal
        document.getElementById('closeImportModal').addEventListener('click', () => {
            document.getElementById('importModal').style.display = 'none';
            document.getElementById('fileName').textContent = '';
        });
        document.getElementById('cancelImportBtn').addEventListener('click', () => {
            document.getElementById('importModal').style.display = 'none';
            document.getElementById('fileName').textContent = '';
        });
        document.getElementById('confirmImportBtn').addEventListener('click', () => {
            this.handleImport();
        });

        // Transaction actions modal
        document.getElementById('closeActionsModal').addEventListener('click', () => {
            document.getElementById('transactionActionsModal').classList.remove('show');
        });
        document.getElementById('modalEditBtn').addEventListener('click', () => {
            const id = parseInt(document.getElementById('modalEditBtn').dataset.id);
            document.getElementById('transactionActionsModal').classList.remove('show');
            this.showEditModal(id);
        });
        document.getElementById('modalDeleteBtn').addEventListener('click', () => {
            const id = parseInt(document.getElementById('modalDeleteBtn').dataset.id);
            document.getElementById('transactionActionsModal').classList.remove('show');
            this.showDeleteModal(id);
        });
        document.getElementById('modalCopyBtn').addEventListener('click', () => {
            const id = parseInt(document.getElementById('modalCopyBtn').dataset.id);
            this.copyTelegramCommand(id);
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        document.addEventListener('click', (e) => {
            const modal = document.getElementById('transactionActionsModal');
            if (modal.classList.contains('show') && !modal.contains(e.target) && !e.target.closest('.transaction-item')) {
                modal.classList.remove('show');
            }
        });
    }

    showClearAllModal() {
        document.getElementById('confirmModal').style.display = 'flex';
    }

    showDeleteModal(id) {
        document.getElementById('confirmDeleteBtn').dataset.id = id;
        document.getElementById('deleteModal').style.display = 'flex';
    }

    showEditModal(id) {
        const transaction = this.transactionManager.getTransactions().find(t => t.id === id);
        if (!transaction) return;
        
        document.getElementById('editAmount').value = transaction.amount;
        document.getElementById('editDescription').value = transaction.description;
        document.getElementById('editDatetime').value = transaction.datetime;
        
        if (transaction.type === 'income') {
            document.getElementById('editIncome').checked = true;
        } else {
            document.getElementById('editExpense').checked = true;
        }
        
        document.getElementById('saveEditBtn').dataset.id = id;
        document.getElementById('editModal').style.display = 'flex';
    }

    handleEditSave() {
        const id = parseInt(document.getElementById('saveEditBtn').dataset.id);
        const type = document.querySelector('input[name="transactionType"]:checked').value;
        const amount = parseFloat(document.getElementById('editAmount').value);
        const description = document.getElementById('editDescription').value;
        const datetime = document.getElementById('editDatetime').value;
        
        if (this.transactionManager.updateTransaction(id, { type, amount, description, datetime })) {
            this.updateUI();
            document.getElementById('editModal').style.display = 'none';
            this.showToast('Transaction updated successfully!');
        }
    }

    showImportModal() {
        document.getElementById('importModal').style.display = 'flex';
    }

    handleImport() {
        const fileInput = document.getElementById('csvFileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            this.showToast('Please select a CSV file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const csvData = event.target.result;
                const importedTransactions = this.transactionManager.parseCSV(csvData);
                
                if (importedTransactions.length > 0) {
                    this.transactionManager.importTransactions(importedTransactions);
                    this.updateUI();
                    this.showToast(`Successfully imported ${importedTransactions.length} transactions!`);
                } else {
                    this.showToast('No valid transactions found in the CSV file.');
                }
            } catch (error) {
                console.error('Error importing CSV:', error);
                this.showToast('Error importing CSV file. Please check the format.');
            }
            
            fileInput.value = '';
            document.getElementById('fileName').textContent = '';
            document.getElementById('importModal').style.display = 'none';
        };
        
        reader.readAsText(file);
    }

    handleExport() {
        try {
            const csvContent = this.transactionManager.exportToCSV();
            this.downloadCSV(csvContent);
            this.showToast('Transactions exported successfully!');
        } catch (error) {
            console.error('Error exporting CSV:', error);
            this.showToast('Error exporting transactions.');
        }
    }

    downloadCSV(csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }

    showTransactionActions(id) {
        const transaction = this.transactionManager.getTransactions().find(t => t.id === id);
        if (!transaction) return;
        
        document.getElementById('modalTransactionDescription').textContent = transaction.description;
        
        const date = new Date(transaction.datetime);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        const formattedTime = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        document.getElementById('modalTransactionDatetime').textContent = `${formattedDate} at ${formattedTime}`;
        
        const amountClass = transaction.type === 'income' ? 'income' : 'expense';
        const amountPrefix = transaction.type === 'income' ? '+' : '-';
        document.getElementById('modalTransactionAmount').textContent = `${amountPrefix}Rp ${this.formatIDR(transaction.amount)}`;
        document.getElementById('modalTransactionAmount').className = `modal-transaction-amount ${amountClass}`;
        
        document.getElementById('modalEditBtn').dataset.id = id;
        document.getElementById('modalDeleteBtn').dataset.id = id;
        document.getElementById('modalCopyBtn').dataset.id = id;
        
        document.getElementById('transactionActionsModal').classList.add('show');
    }

    copyTelegramCommand(id) {
        const transaction = this.transactionManager.getTransactions().find(t => t.id === id);
        if (!transaction) return;
        
        const command = transaction.type === 'income' 
            ? `.in ${transaction.amount} ${transaction.description}`
            : `.out ${transaction.amount} ${transaction.description}`;
        
        navigator.clipboard.writeText(command).then(() => {
            this.showToast('Telegram command copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            this.showToast('Failed to copy command');
        });
    }

    getFilteredTransactions() {
        const allTransactions = this.transactionManager.getTransactions();
        const now = new Date();
        let startDate;

        switch (this.currentPeriod) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'all':
                return allTransactions; // Return all transactions
            default:
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        return allTransactions.filter(transaction => {
            const transactionDate = new Date(transaction.datetime);
            return transactionDate >= startDate;
        });
    }

    updateUI() {
        this.updateBalance();
        this.renderTransactions();
        if (this.insightsManager) { // Add this check
            this.insightsManager.generateInsights(); // Refresh insights when UI updates
        }
    }

    updateBalance() {
        const balance = this.transactionManager.getBalance();
        document.getElementById('currentBalance').textContent = `Rp ${this.formatIDR(balance.current)}`;
        document.getElementById('totalIncome').textContent = `Rp ${this.formatIDR(balance.income)}`;
        document.getElementById('totalExpense').textContent = `Rp ${this.formatIDR(balance.expense)}`;
    }

    renderTransactions() {
        const weeklyTransactionList = document.getElementById('weeklyTransactionList');
        const pagination = document.getElementById('pagination');
        const paginationInfo = document.getElementById('paginationInfo');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        // Get filtered transactions based on current period
        const filteredTransactions = this.getFilteredTransactions();
        
        if (filteredTransactions.length === 0) {
            weeklyTransactionList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions found for this period.</p>
                </div>
            `;
            pagination.style.display = 'none';
            return;
        }
        
        // Create a temporary transaction manager for pagination with filtered data
        const tempTransactionManager = {
            ...this.transactionManager,
            getTransactions: () => filteredTransactions,
            getPaginatedTransactions: () => {
                const sortedTransactions = [...filteredTransactions].sort((a, b) => {
                    return new Date(b.datetime) - new Date(a.datetime);
                });
                
                const startIndex = (this.transactionManager.currentPage - 1) * this.transactionManager.itemsPerPage;
                const endIndex = Math.min(startIndex + this.transactionManager.itemsPerPage, sortedTransactions.length);
                
                return sortedTransactions.slice(startIndex, endIndex);
            },
            getTotalPages: () => Math.ceil(filteredTransactions.length / this.transactionManager.itemsPerPage)
        };
        
        const paginatedTransactions = tempTransactionManager.getPaginatedTransactions();
        const totalPages = tempTransactionManager.getTotalPages();
        const startIndex = (this.transactionManager.currentPage - 1) * this.transactionManager.itemsPerPage + 1;
        const endIndex = Math.min(startIndex + paginatedTransactions.length - 1, filteredTransactions.length);
        
        paginationInfo.textContent = `${startIndex}-${endIndex} of ${filteredTransactions.length}`;
        prevBtn.disabled = this.transactionManager.currentPage === 1;
        nextBtn.disabled = this.transactionManager.currentPage === totalPages;
        pagination.style.display = filteredTransactions.length > this.transactionManager.itemsPerPage ? 'flex' : 'none';
        
        const transactionsByDay = {};
        paginatedTransactions.forEach(transaction => {
            const date = new Date(transaction.datetime);
            const dayKey = date.toDateString();
            
            if (!transactionsByDay[dayKey]) {
                transactionsByDay[dayKey] = [];
            }
            transactionsByDay[dayKey].push(transaction);
        });
        
        const sortedDays = Object.keys(transactionsByDay).sort((a, b) => {
            return new Date(b) - new Date(a);
        });
        
        weeklyTransactionList.innerHTML = '';
        
        sortedDays.forEach(dayKey => {
            const dayTransactions = transactionsByDay[dayKey];
            const date = new Date(dayKey);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            let dayLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            
            if (date.toDateString() === today.toDateString()) {
                dayLabel = 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                dayLabel = 'Yesterday';
            }
            
            const dayGroup = document.createElement('div');
            dayGroup.className = 'day-group';
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.textContent = dayLabel;
            
            const transactionList = document.createElement('div');
            transactionList.className = 'transaction-list';
            
            dayTransactions.sort((a, b) => {
                return new Date(b.datetime) - new Date(a.datetime);
            });
            
            dayTransactions.forEach(transaction => {
                const time = new Date(transaction.datetime);
                const formattedTime = time.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                const transactionItem = document.createElement('div');
                transactionItem.className = 'transaction-item';
                transactionItem.setAttribute('data-id', transaction.id);
                
                const amountClass = transaction.type === 'income' ? 'income' : 'expense';
                const amountPrefix = transaction.type === 'income' ? '+' : '-';
                
                transactionItem.innerHTML = `
                    <div class="transaction-details">
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-time">${formattedTime}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountPrefix}Rp ${this.formatIDR(transaction.amount)}
                    </div>
                `;
                
                transactionItem.addEventListener('click', () => {
                    this.showTransactionActions(transaction.id);
                });
                
                transactionList.appendChild(transactionItem);
            });
            
            dayGroup.appendChild(dayHeader);
            dayGroup.appendChild(transactionList);
            weeklyTransactionList.appendChild(dayGroup);
        });
    }

    updateWeekRange() {
        const now = new Date();
        let startDate, endDate;
        let rangeText = '';

        switch (this.currentPeriod) {
            case 'week':
                const dayOfWeek = now.getDay();
                const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                startDate = new Date(now.setDate(diff));
                endDate = new Date(now.setDate(diff + 6));
                rangeText = `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                rangeText = this.formatDate(startDate, 'long');
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                rangeText = now.getFullYear().toString();
                break;
            case 'all':
                const transactions = this.transactionManager.getTransactions();
                if (transactions.length === 0) {
                    rangeText = 'No transactions';
                } else {
                    const dates = transactions.map(t => new Date(t.datetime));
                    const minDate = new Date(Math.min(...dates));
                    const maxDate = new Date(Math.max(...dates));
                    rangeText = `${this.formatDate(minDate, 'short')} - ${this.formatDate(maxDate, 'short')}`;
                }
                break;
        }

        document.getElementById('weekRange').textContent = rangeText;
    }

    formatDate(date, format = 'short') {
        const options = format === 'long' 
            ? { month: 'long', year: 'numeric' }
            : { month: 'short', day: 'numeric' };
        
        return date.toLocaleDateString('en-US', options);
    }

    setCurrentDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        document.getElementById('datetime').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    resetForm() {
        document.getElementById('transactionForm').reset();
        this.setCurrentDateTime();
    }

    formatIDR(amount) {
        return new Intl.NumberFormat('id-ID').format(amount);
    }

    showToast(message) {
        this.toast.textContent = message;
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}
