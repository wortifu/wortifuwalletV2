import { ThemeManager } from './modules/theme.js';
import { AuthManager } from './modules/auth.js';
import { TransactionManager } from './modules/transactions.js';
import { UIManager } from './modules/ui.js';
// No need to import AIInsightsManager here as it's handled by UIManager

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize managers
    const themeManager = new ThemeManager();
    const authManager = new AuthManager();
    const transactionManager = new TransactionManager();
    
    // Set auth callback
    authManager.setAuthCallback(() => {
        // Initialize UI after successful authentication
        const uiManager = new UIManager(transactionManager);
        uiManager.updateUI();
        
        // Update analytics when transactions change
        const originalAddTransaction = transactionManager.addTransaction.bind(transactionManager);
        const originalUpdateTransaction = transactionManager.updateTransaction.bind(transactionManager);
        const originalDeleteTransaction = transactionManager.deleteTransaction.bind(transactionManager);
        const originalClearAllTransactions = transactionManager.clearAllTransactions.bind(transactionManager);
        
        transactionManager.addTransaction = function(transaction) {
            originalAddTransaction(transaction);
            uiManager.updateUI(); // This will refresh insights
        };
        
        transactionManager.updateTransaction = function(id, data) {
            const result = originalUpdateTransaction(id, data);
            if (result) uiManager.updateUI(); // This will refresh insights
            return result;
        };
        
        transactionManager.deleteTransaction = function(id) {
            const result = originalDeleteTransaction(id);
            if (result) uiManager.updateUI(); // This will refresh insights
            return result;
        };
        
        transactionManager.clearAllTransactions = function() {
            originalClearAllTransactions();
            uiManager.updateUI(); // This will refresh insights
        };
        
        // Handle CSV import
        const originalImportTransactions = transactionManager.importTransactions.bind(transactionManager);
        transactionManager.importTransactions = function(transactions) {
            originalImportTransactions(transactions);
            uiManager.updateUI(); // This will refresh insights
        };
    });
    
    // File input change event
    document.getElementById('csvFileInput').addEventListener('change', function() {
        const fileName = document.getElementById('fileName');
        if (this.files.length > 0) {
            fileName.textContent = this.files[0].name;
        } else {
            fileName.textContent = '';
        }
    });
});
