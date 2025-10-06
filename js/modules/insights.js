export class AIInsightsManager {
    constructor(transactionManager) {
        this.transactionManager = transactionManager;
        this.insights = [];
        this.lastAnalysis = null;
        this.maxInsights = 4; // Limit to 4 insights for 2x2 grid
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.generateInsights();
    }

    setupEventListeners() {
        document.getElementById('refreshInsights').addEventListener('click', () => {
            this.refreshInsights();
        });

        document.getElementById('detailedAnalysis').addEventListener('click', () => {
            this.showDetailedAnalysis();
        });

        // Close analysis modal
        document.getElementById('closeAnalysisModal').addEventListener('click', () => {
            document.getElementById('analysisModal').classList.remove('show');
        });

        // Close modal when clicking outside
        document.getElementById('analysisModal').addEventListener('click', (e) => {
            if (e.target.id === 'analysisModal') {
                document.getElementById('analysisModal').classList.remove('show');
            }
        });
    }

    async generateInsights() {
        this.showLoading();
        
        // Simulate AI processing delay
        await this.delay(1000);
        
        const transactions = this.transactionManager.getTransactions();
        const analysis = this.analyzeTransactions(transactions);
        
        this.insights = this.generateInsightCards(analysis);
        this.lastAnalysis = analysis;
        
        this.renderInsights();
    }

    analyzeTransactions(transactions) {
        if (transactions.length === 0) {
            return {
                totalTransactions: 0,
                totalIncome: 0,
                totalExpense: 0,
                averageTransaction: 0,
                spendingPattern: {},
                categories: {},
                trends: {},
                savingsRate: 0,
                financialHealth: 'poor'
            };
        }

        const now = new Date();
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const recentTransactions = transactions.filter(t => new Date(t.datetime) >= oneMonthAgo);
        const weeklyTransactions = transactions.filter(t => new Date(t.datetime) >= oneWeekAgo);

        let totalIncome = 0;
        let totalExpense = 0;
        const categories = {};
        const dailySpending = {};

        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += transaction.amount;
            } else {
                totalExpense += transaction.amount;
                
                // Category analysis
                const category = transaction.category || 'other';
                categories[category] = (categories[category] || 0) + transaction.amount;
                
                // Daily spending pattern
                const date = new Date(transaction.datetime).toDateString();
                dailySpending[date] = (dailySpending[date] || 0) + transaction.amount;
            }
        });

        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100) : 0;
        const averageTransaction = transactions.length > 0 ? (totalIncome + totalExpense) / transactions.length : 0;

        // Determine financial health
        let financialHealth = 'poor';
        if (savingsRate > 20) financialHealth = 'excellent';
        else if (savingsRate > 10) financialHealth = 'good';
        else if (savingsRate > 0) financialHealth = 'fair';

        // Spending trend analysis
        const recentExpense = weeklyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const monthlyExpenseEstimate = recentExpense * 4.33; // Average weeks in month

        return {
            totalTransactions: transactions.length,
            totalIncome,
            totalExpense,
            averageTransaction,
            recentTransactions: recentTransactions.length,
            weeklyTransactions: weeklyTransactions.length,
            categories,
            dailySpending,
            savingsRate,
            financialHealth,
            monthlyExpenseEstimate,
            recentExpense
        };
    }

    generateInsightCards(analysis) {
        const insights = [];

        // Savings Rate Insight - Always include
        if (analysis.totalTransactions > 0) {
            if (analysis.savingsRate < 0) {
                insights.push({
                    type: 'warning',
                    priority: 'high',
                    title: 'Negative Savings',
                    content: `Spending ${Math.abs(analysis.savingsRate).toFixed(0)}% more than income`,
                    metrics: [
                        { label: 'Rate', value: `${analysis.savingsRate.toFixed(0)}%` }
                    ],
                    icon: 'exclamation-triangle'
                });
            } else if (analysis.savingsRate < 10) {
                insights.push({
                    type: 'warning',
                    priority: 'medium',
                    title: 'Low Savings Rate',
                    content: `Only ${analysis.savingsRate.toFixed(0)}% of income saved`,
                    metrics: [
                        { label: 'Rate', value: `${analysis.savingsRate.toFixed(0)}%` }
                    ],
                    icon: 'exclamation-circle'
                });
            } else {
                insights.push({
                    type: 'success',
                    priority: 'low',
                    title: 'Healthy Savings',
                    content: `Great job saving ${analysis.savingsRate.toFixed(0)}% of income`,
                    metrics: [
                        { label: 'Rate', value: `${analysis.savingsRate.toFixed(0)}%` }
                    ],
                    icon: 'check-circle'
                });
            }
        }

        // Weekly Spending Insight
        if (analysis.weeklyTransactions > 0) {
            const avgWeeklySpending = analysis.recentExpense;
            insights.push({
                type: 'info',
                priority: 'medium',
                title: 'Weekly Spending',
                content: `Rp ${this.formatIDR(avgWeeklySpending)} this week`,
                metrics: [
                    { label: 'Amount', value: this.formatShortIDR(avgWeeklySpending) }
                ],
                icon: 'chart-line'
            });
        }

        // Top Category Insight
        if (Object.keys(analysis.categories).length > 0) {
            const topCategory = Object.entries(analysis.categories).reduce((a, b) => a[1] > b[1] ? a : b);
            const categoryPercentage = (topCategory[1] / analysis.totalExpense * 100).toFixed(0);
            
            insights.push({
                type: 'info',
                priority: 'low',
                title: 'Top Category',
                content: `${this.formatCategoryName(topCategory[0])}: ${categoryPercentage}% of spending`,
                metrics: [
                    { label: 'Share', value: `${categoryPercentage}%` }
                ],
                icon: 'tag'
            });
        }

        // Financial Health Score
        insights.push({
            type: analysis.financialHealth === 'excellent' ? 'success' : 
                  analysis.financialHealth === 'good' ? 'info' : 'warning',
            priority: 'medium',
            title: 'Financial Health',
            content: `Status: ${analysis.financialHealth}`,
            metrics: [
                { label: 'Score', value: this.getHealthScore(analysis) }
            ],
            icon: 'heart'
        });

        // Sort by priority and limit to maxInsights
        return insights
            .sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            })
            .slice(0, this.maxInsights);
    }

    formatShortIDR(amount) {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(0)}K`;
        }
        return this.formatIDR(amount);
    }

    getHealthAdvice(health) {
        const advice = {
            excellent: 'Keep up the great work!',
            good: 'You\'re on the right track.',
            fair: 'Room for improvement.',
            poor: 'Immediate attention needed.'
        };
        return advice[health] || '';
    }

    getHealthScore(analysis) {
        let score = 0;
        
        // Savings rate score (40%)
        if (analysis.savingsRate > 20) score += 40;
        else if (analysis.savingsRate > 10) score += 30;
        else if (analysis.savingsRate > 0) score += 20;
        
        // Transaction frequency score (20%)
        const avgDaily = analysis.recentTransactions / 30;
        if (avgDaily >= 1 && avgDaily <= 3) score += 20;
        else if (avgDaily > 0 && avgDaily <= 5) score += 15;
        else if (avgDaily > 0) score += 10;
        
        // Income consistency score (20%)
        if (analysis.totalIncome > 0) score += 20;
        
        // Expense control score (20%)
        if (analysis.totalExpense < analysis.totalIncome) score += 20;
        else if (analysis.totalExpense < analysis.totalIncome * 1.1) score += 10;
        
        return `${score}/100`;
    }

    renderInsights() {
        const container = document.getElementById('insightsContainer');
        
        if (this.insights.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-brain"></i>
                    <p>Add transactions to get insights</p>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        
        this.insights.forEach(insight => {
            const card = document.createElement('div');
            card.className = `insight-card ${insight.type}`;
            card.innerHTML = `
                <div class="insight-header">
                    <div class="insight-icon ${insight.type}">
                        <i class="fas fa-${insight.icon}"></i>
                    </div>
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-badge ${insight.priority}">${insight.priority}</div>
                </div>
                <div class="insight-content">${insight.content}</div>
                ${insight.metrics ? `
                    <div class="insight-metrics">
                        ${insight.metrics.map(metric => `
                            <div class="insight-metric">
                                <i class="fas fa-circle"></i>
                                <span>${metric.label}: <strong>${metric.value}</strong></span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;
            
            card.addEventListener('click', () => {
                this.showInsightDetail(insight);
            });
            
            container.appendChild(card);
        });
    }

    showInsightDetail(insight) {
        this.showToast(`${insight.title}: ${insight.content}`);
    }

    showLoading() {
        const container = document.getElementById('insightsContainer');
        container.innerHTML = `
            <div class="insight-loading">
                <i class="fas fa-spinner fa-spin"></i>
                <span>Analyzing financial data...</span>
            </div>
        `;
    }

    async refreshInsights() {
        const btn = document.getElementById('refreshInsights');
        const icon = btn.querySelector('i');
        icon.classList.add('fa-spin');
        
        await this.generateInsights();
        
        icon.classList.remove('fa-spin');
        this.showToast('Insights refreshed!');
    }

    showDetailedAnalysis() {
        if (!this.lastAnalysis) {
            this.showToast('No data available');
            return;
        }

        const modal = document.getElementById('analysisModal');
        const content = document.getElementById('analysisContent');
        
        content.innerHTML = `
            <div class="analysis-section">
                <h3><i class="fas fa-chart-pie"></i> Financial Overview</h3>
                <div class="analysis-item">
                    <span class="analysis-label">Total Transactions</span>
                    <span class="analysis-value">${this.lastAnalysis.totalTransactions}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Total Income</span>
                    <span class="analysis-value">Rp ${this.formatIDR(this.lastAnalysis.totalIncome)}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Total Expenses</span>
                    <span class="analysis-value">Rp ${this.formatIDR(this.lastAnalysis.totalExpense)}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Net Balance</span>
                    <span class="analysis-value">Rp ${this.formatIDR(this.lastAnalysis.totalIncome - this.lastAnalysis.totalExpense)}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Savings Rate</span>
                    <span class="analysis-value">${this.lastAnalysis.savingsRate.toFixed(1)}%</span>
                </div>
                <div class="analysis-progress">
                    <div class="analysis-progress-bar" style="width: ${Math.min(this.lastAnalysis.savingsRate, 100)}%"></div>
                </div>
            </div>

            <div class="analysis-section">
                <h3><i class="fas fa-tags"></i> Top Categories</h3>
                ${Object.entries(this.lastAnalysis.categories)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([category, amount]) => {
                    const percentage = (amount / this.lastAnalysis.totalExpense * 100).toFixed(0);
                    return `
                        <div class="analysis-item">
                            <span class="analysis-label">${this.formatCategoryName(category)}</span>
                            <span class="analysis-value">${percentage}%</span>
                        </div>
                        <div class="analysis-progress">
                            <div class="analysis-progress-bar" style="width: ${percentage}%"></div>
                        </div>
                    `;
                }).join('')}
            </div>

            <div class="analysis-section">
                <h3><i class="fas fa-lightbulb"></i> Key Recommendations</h3>
                <div class="analysis-recommendations">
                    ${this.generateTopRecommendations()}
                </div>
            </div>
        `;
        
        modal.classList.add('show');
    }

    generateTopRecommendations() {
        const recommendations = [];
        const analysis = this.lastAnalysis;

        if (analysis.savingsRate < 0) {
            recommendations.push(`
                <div class="analysis-recommendation">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span class="analysis-recommendation-text">
                        <strong>Urgent:</strong> Reduce expenses immediately
                    </span>
                </div>
            `);
        }

        if (analysis.savingsRate < 10) {
            recommendations.push(`
                <div class="analysis-recommendation">
                    <i class="fas fa-piggy-bank"></i>
                    <span class="analysis-recommendation-text">
                        Aim to save at least 20% of income
                    </span>
                </div>
            `);
        }

        const topCategory = Object.entries(analysis.categories).reduce((a, b) => a[1] > b[1] ? a : b, ['', 0]);
        if (topCategory[1] / analysis.totalExpense > 0.4) {
            recommendations.push(`
                <div class="analysis-recommendation">
                    <i class="fas fa-chart-pie"></i>
                    <span class="analysis-recommendation-text">
                        Reduce ${this.formatCategoryName(topCategory[0])} expenses
                    </span>
                </div>
            `);
        }

        if (recommendations.length === 0) {
            recommendations.push(`
                <div class="analysis-recommendation">
                    <i class="fas fa-check-circle"></i>
                    <span class="analysis-recommendation-text">
                        Great job! Keep maintaining your financial discipline
                    </span>
                </div>
            `);
        }

        return recommendations.join('');
    }

    formatCategoryName(category) {
        const categoryNames = {
            'food': '🍔 Food',
            'transport': '🚗 Transport',
            'shopping': '🛍️ Shopping',
            'bills': '📄 Bills',
            'entertainment': '🎬 Entertainment',
            'health': '🏥 Health',
            'salary': '💰 Salary',
            'other': '📌 Other'
        };
        
        return categoryNames[category] || category;
    }

    formatIDR(amount) {
        return new Intl.NumberFormat('id-ID').format(amount);
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
