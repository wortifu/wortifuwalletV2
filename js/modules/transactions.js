export class TransactionManager {
    constructor() {
        this.transactions = [];
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.loadTransactions();
    }

    loadTransactions() {
        const savedTransactions = localStorage.getItem('transactions');
        if (savedTransactions) {
            this.transactions = JSON.parse(savedTransactions);
        }
    }

    saveTransactions() {
        localStorage.setItem('transactions', JSON.stringify(this.transactions));
    }

    addTransaction(transaction) {
        this.transactions.push(transaction);
        this.saveTransactions();
    }

    updateTransaction(id, updatedData) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            this.transactions[index] = { ...this.transactions[index], ...updatedData };
            this.saveTransactions();
            return true;
        }
        return false;
    }

    deleteTransaction(id) {
        const index = this.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            this.transactions.splice(index, 1);
            this.saveTransactions();
            
            // Adjust current page if necessary
            const totalPages = Math.ceil(this.transactions.length / this.itemsPerPage);
            if (this.currentPage > totalPages && totalPages > 0) {
                this.currentPage = totalPages;
            }
            return true;
        }
        return false;
    }

    clearAllTransactions() {
        this.transactions = [];
        this.currentPage = 1;
        this.saveTransactions();
    }

    getTransactions() {
        return this.transactions;
    }

    getPaginatedTransactions() {
        const sortedTransactions = [...this.transactions].sort((a, b) => {
            return new Date(b.datetime) - new Date(a.datetime);
        });
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, sortedTransactions.length);
        
        return sortedTransactions.slice(startIndex, endIndex);
    }

    getTotalPages() {
        return Math.ceil(this.transactions.length / this.itemsPerPage);
    }

    getBalance() {
        let totalIncome = 0;
        let totalExpense = 0;
        
        this.transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else {
                totalExpense += transaction.amount;
            }
        });
        
        return {
            current: totalIncome - totalExpense,
            income: totalIncome,
            expense: totalExpense
        };
    }

    importTransactions(importedTransactions) {
        this.transactions.push(...importedTransactions);
        this.saveTransactions();
    }

    exportToCSV() {
        if (this.transactions.length === 0) {
            throw new Error('No transactions to export');
        }
        
        let csvContent = 'Date,Type,Amount,Description\n';
        
        this.transactions.forEach(transaction => {
            const date = new Date(transaction.datetime);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            
            const dateStr = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
            const typeStr = transaction.type === 'income' ? 'IN' : 'OUT';
            
            let description = transaction.description;
            if (description.includes(',')) {
                description = `"${description}"`;
            }
            
            csvContent += `${dateStr},${typeStr},${transaction.amount},${description}\n`;
        });
        
        return csvContent;
    }

    parseCSV(csvData) {
        const lines = csvData.split('\n').filter(line => line.trim() !== '');
        const importedTransactions = [];
        
        const startIndex = lines[0].toLowerCase().includes('date') ? 1 : 0;
        
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const parts = [];
            let current = '';
            let inQuotes = false;
            
            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    parts.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            
            parts.push(current.trim());
            
            if (parts.length < 4) continue;
            
            let dateStr = parts[0];
            let datetime;
            
            if (dateStr.includes('/')) {
                const [datePart, timePart] = dateStr.split(' ');
                const [day, month, year] = datePart.split('/');
                datetime = `${year}-${month}-${day}T${timePart || '00:00:00'}`;
            } else if (dateStr.includes('T')) {
                datetime = dateStr;
            } else {
                continue;
            }
            
            let type = parts[1].toLowerCase();
            if (type === 'in') {
                type = 'income';
            } else if (type === 'out') {
                type = 'expense';
            } else if (type !== 'income' && type !== 'expense') {
                continue;
            }
            
            const amount = parseFloat(parts[2]);
            if (isNaN(amount)) continue;
            
            let description = parts[3];
            if (description.startsWith('"') && description.endsWith('"')) {
                description = description.substring(1, description.length - 1);
            }
            
            const transaction = {
                id: Date.now() + i,
                type: type,
                amount: amount,
                description: description,
                datetime: datetime
            };
            
            importedTransactions.push(transaction);
        }
        
        return importedTransactions;
    }
}
