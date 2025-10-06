export class AuthManager {
    constructor() {
        this.loginScreen = document.getElementById('loginScreen');
        this.passwordDots = document.querySelectorAll('.dot');
        this.numpadBtns = document.querySelectorAll('.numpad-btn');
        this.loginStatus = document.getElementById('loginStatus');
        this.loginSuccess = document.getElementById('loginSuccess');
        this.continueBtn = document.getElementById('continueBtn');
        this.correctPassword = '112233';
        this.enteredPassword = '';
        this.isAuthenticated = false;
        this.onAuthSuccess = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkStoredTheme();
    }

    checkStoredTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.adaptLoginScreenToTheme(savedTheme);
    }

    adaptLoginScreenToTheme(theme) {
        // The CSS already handles theme adaptation through CSS variables
        // This method can be used for any additional theme-specific adjustments
        console.log(`Login screen adapted to ${theme} theme`);
    }

    setupEventListeners() {
        // Numpad button listeners
        this.numpadBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleNumpadInput(btn));
        });

        // Continue button listener
        this.continueBtn.addEventListener('click', () => {
            this.handleContinue();
        });

        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isAuthenticated) {
                this.logout();
            }
        });
    }

    handleNumpadInput(button) {
        const value = button.getAttribute('data-value');
        
        if (value === 'clear') {
            this.clearPassword();
        } else if (value === 'backspace') {
            this.removeLastDigit();
        } else if (value === 'enter') {
            this.validatePassword();
        } else {
            this.addDigit(value);
        }
    }

    addDigit(digit) {
        if (this.enteredPassword.length < 6) {
            this.enteredPassword += digit;
            this.updatePasswordDisplay();
            this.hideLoginStatus();
        }
    }

    removeLastDigit() {
        if (this.enteredPassword.length > 0) {
            this.enteredPassword = this.enteredPassword.slice(0, -1);
            this.updatePasswordDisplay();
            this.hideLoginStatus();
        }
    }

    clearPassword() {
        this.enteredPassword = '';
        this.updatePasswordDisplay();
        this.hideLoginStatus();
    }

    updatePasswordDisplay() {
        this.passwordDots.forEach((dot, index) => {
            if (index < this.enteredPassword.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    }

    validatePassword() {
        if (this.enteredPassword === this.correctPassword) {
            this.showLoginSuccess();
        } else {
            this.showLoginError();
        }
    }

    showLoginSuccess() {
        this.isAuthenticated = true;
        this.loginSuccess.classList.add('show');
        
        // Save authentication state
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('authTime', new Date().toISOString());
        
        // Auto continue after 2 seconds
        setTimeout(() => {
            this.proceedToApp();
        }, 2000);
    }

    showLoginError() {
        this.showLoginStatus('Kata sandi salah. Silakan coba lagi.', false);
        
        // Shake animation
        const container = this.loginScreen.querySelector('.login-container');
        container.style.animation = 'shake 0.5s';
        setTimeout(() => {
            container.style.animation = '';
        }, 500);
        
        // Clear password after delay
        setTimeout(() => {
            this.clearPassword();
        }, 1500);
    }

    showLoginStatus(message, isSuccess = false) {
        this.loginStatus.textContent = message;
        this.loginStatus.classList.add('show');
        
        if (isSuccess) {
            this.loginStatus.classList.add('success');
        } else {
            this.loginStatus.classList.remove('success');
        }
    }

    hideLoginStatus() {
        this.loginStatus.classList.remove('show');
    }

    handleContinue() {
        this.proceedToApp();
    }

    proceedToApp() {
        // Hide login screen
        this.loginScreen.classList.add('hide');
        
        // Initialize app after successful login
        if (this.onAuthSuccess) {
            this.onAuthSuccess();
        }
    }

    logout() {
        this.isAuthenticated = false;
        this.enteredPassword = '';
        this.updatePasswordDisplay();
        this.hideLoginStatus();
        
        // Clear authentication state
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authTime');
        
        // Show login screen
        this.loginScreen.classList.remove('hide');
    }

    checkAuthentication() {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        const authTime = localStorage.getItem('authTime');
        
        if (isAuthenticated && authTime) {
            const authDate = new Date(authTime);
            const now = new Date();
            const hoursSinceAuth = (now - authDate) / (1000 * 60 * 60);
            
            // Auto-logout after 24 hours
            if (hoursSinceAuth < 24) {
                this.isAuthenticated = true;
                return true;
            } else {
                this.logout();
                return false;
            }
        }
        
        return false;
    }

    setAuthCallback(callback) {
        this.onAuthSuccess = callback;
    }

    // Method to update theme dynamically
    updateTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        this.adaptLoginScreenToTheme(theme);
        localStorage.setItem('theme', theme);
    }
}
