// ==========================================
// WELCOME BANNER - First-time users only
// ==========================================

/**
 * Initialize welcome banner functionality
 * Call this function when DOM is ready
 */
export function initWelcomeBanner() {
    // Check if first visit
    const hasVisited = localStorage.getItem('fittrack-visited');
    
    if (!hasVisited) {
        const banner = document.getElementById('welcome-banner');
        if (banner) {
            banner.style.display = 'block';
            console.log('👋 Welcome! Showing first-time banner');
        }
    }
    
    // Expose functions to global scope for onclick to work
    window.dismissWelcomeBanner = dismissWelcomeBanner;
    window.showQuickTour = showQuickTour;
}

/**
 * Dismiss banner permanently with smooth animation
 */
function dismissWelcomeBanner() {
    localStorage.setItem('fittrack-visited', 'true');
    const banner = document.getElementById('welcome-banner');
    
    if (banner) {
        // Fade out animation
        banner.style.opacity = '0';
        banner.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            banner.style.display = 'none';
            console.log('✅ Banner dismissed - won\'t show again');
        }, 300);
    }
}

/**
 * Show quick tour alert with app overview
 */
function showQuickTour() {
    alert('🏋️ Welcome to FitTracker - Quick Tour!\n\n' +
          '📊 DASHBOARD\n' +
          '   • View today\'s workout and nutrition\n' +
          '   • Track your weekly progress\n' +
          '   • Monitor your daily streak\n\n' +
          
          '💪 EXERCISES\n' +
          '   • Browse 1,300+ exercises\n' +
          '   • Search by name, muscle, or equipment\n' +
          '   • View detailed instructions\n\n' +
          
          '🍽️ NUTRITION\n' +
          '   • Search 300,000+ foods (USDA database)\n' +
          '   • Track meals and calories\n' +
          '   • See color-coded nutrition info\n\n' +
          
          '📈 PROGRESS\n' +
          '   • View total workouts and stats\n' +
          '   • Track calorie averages\n' +
          '   • Monitor your longest streak\n\n' +
          
          '💡 TIP: All data saves automatically on your device!\n' +
          'Use the navigation menu to explore each section.');
    
    console.log('📖 Quick tour shown');
    
    // Dismiss banner after tour
    dismissWelcomeBanner();
}

// paste into the pag console:
// localStorage.removeItem('fittrack-visited');
// location.reload();