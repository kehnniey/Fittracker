// ==========================================
// HAMBURGER MENU TOGGLE
// ==========================================

/**
 * Initialize hamburger menu functionality
 * Call this function when DOM is ready
 */
export function initHamburgerMenu() {
    const menu = document.getElementById('menu');
    const navList = document.getElementById('nav-list');
    const navOverlay = document.getElementById('navOverlay');
    const navLinks = document.querySelectorAll('.nav a');

    // Verify elements exist
    if (!menu || !navList || !navOverlay) {
        console.error('Navigation elements not found!');
        return;
    }

    console.log('✅ Navigation initialized');

    // Create the middle line span for the hamburger
    const middleLine = document.createElement('span');
    menu.appendChild(middleLine);

    // Toggle menu
    function toggleMenu() {
        menu.classList.toggle('active');
        navList.classList.toggle('active');
        navOverlay.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (navList.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
            console.log('🔒 Menu opened, body scroll locked');
        } else {
            document.body.style.overflow = '';
            console.log('🔓 Menu closed, body scroll unlocked');
        }
    }

    // Close menu
    function closeMenu() {
        menu.classList.remove('active');
        navList.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
        console.log('❌ Menu closed');
    }

    // Smooth scroll to section
    function scrollToSection(targetId) {
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            console.log('📍 Scrolling to:', targetId);
            
            // Close menu first
            closeMenu();
            
            // Wait for menu animation (300ms), then scroll
            setTimeout(() => {
                targetSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }, 300);
        } else {
            console.warn('⚠️ Section not found:', targetId);
        }
    }

    // Event listeners
    menu.addEventListener('click', function() {
        console.log('🍔 Hamburger clicked');
        toggleMenu();
    });

    navOverlay.addEventListener('click', function() {
        console.log('🌑 Overlay clicked');
        closeMenu();
    });

    // Close menu when clicking nav links and scroll to section
    navLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const href = this.getAttribute('href');
            console.log(`🔗 Link ${index + 1} clicked:`, href);
            
            if (href && href.startsWith('#')) {
                const targetId = href.substring(1);
                scrollToSection(targetId);
            }
        });
    });

    // Close menu on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navList.classList.contains('active')) {
            console.log('⌨️ Escape key pressed');
            closeMenu();
        }
    });

    console.log(`✅ Navigation ready! Found ${navLinks.length} links`);
}