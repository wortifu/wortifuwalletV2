export class ThemeManager {
    constructor() {
        this.themeDropdown = document.getElementById('themeDropdown');
        this.themeDropdownBtn = document.getElementById('themeDropdownBtn');
        this.themeDropdownMenu = document.getElementById('themeDropdownMenu');
        this.themeIcon = document.getElementById('themeIcon');
        this.themeOptions = document.querySelectorAll('.theme-option');
        this.isOpen = false;
        this.themeChangeListeners = [];
        this.init();
    }

    init() {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        // Add event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Toggle dropdown
        this.themeDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleDropdown();
        });

        // Handle theme selection
        this.themeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const theme = option.dataset.theme;
                this.setTheme(theme);
                this.closeDropdown();
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.themeDropdown.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Handle keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeDropdown();
            }
        });
    }

    toggleDropdown() {
        this.isOpen = !this.isOpen;
        if (this.isOpen) {
            this.openDropdown();
        } else {
            this.closeDropdown();
        }
    }

    openDropdown() {
        this.themeDropdown.classList.add('open');
        this.isOpen = true;
        
        // Focus first theme option for accessibility
        const activeOption = this.themeDropdownMenu.querySelector('.theme-option.active');
        if (activeOption) {
            activeOption.focus();
        }
    }

    closeDropdown() {
        this.themeDropdown.classList.remove('open');
        this.isOpen = false;
    }

    setTheme(theme) {
        // Set theme on document
        document.documentElement.setAttribute('data-theme', theme);
        
        // Save to localStorage
        localStorage.setItem('theme', theme);
        
        // Update active state
        this.updateActiveTheme(theme);
        
        // Update icon
        this.updateThemeIcon(theme);
        
        // Notify listeners
        this.notifyThemeChange(theme);
    }

    updateActiveTheme(theme) {
        // Remove active class from all options
        this.themeOptions.forEach(option => {
            option.classList.remove('active');
        });
        
        // Add active class to selected option
        const selectedOption = this.themeDropdownMenu.querySelector(`[data-theme="${theme}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }
    }

    updateThemeIcon(theme) {
        const iconMap = {
            'light': 'fa-sun',
            'dark': 'fa-moon',
            'ocean': 'fa-water',
            'dark-blue': 'fa-droplet'
        };
        
        const iconClass = iconMap[theme] || 'fa-palette';
        this.themeIcon.className = `fas ${iconClass}`;
    }

    addThemeChangeListener(callback) {
        this.themeChangeListeners.push(callback);
    }

    removeThemeChangeListener(callback) {
        const index = this.themeChangeListeners.indexOf(callback);
        if (index > -1) {
            this.themeChangeListeners.splice(index, 1);
        }
    }

    notifyThemeChange(theme) {
        this.themeChangeListeners.forEach(callback => {
            if (typeof callback === 'function') {
                callback(theme);
            }
        });
    }
}
