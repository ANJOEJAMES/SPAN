/**
 * Admin Panel - Main Entry Point
 * Load all modules in order
 * 
 * Module structure:
 * 01-config.js    - Global config and state
 * 02-auth.js     - Authentication & session
 * 03-toast.js    - Toast notifications
 * 04-navigation.js - Sidebar & section navigation
 * 05-posts.js   - Blog posts management
 * 06-posts-upload.js - Image upload for posts
 * 07-gallery.js - Gallery management
 * 08-gallery-upload.js - Photo upload
 * 09-categories.js - Category management
 * 10-testimonials.js - Testimonials
 * 11-stats.js   - Site statistics
 * 12-subscriptions.js - Newsletter subscribers
 */

(function() {
    // Load scripts in order
    const modules = [
        'js/modules/01-config.js',
        'js/modules/02-auth.js', 
        'js/modules/03-toast.js',
        'js/modules/04-navigation.js',
        'js/modules/05-posts.js',
        'js/modules/06-posts-upload.js',
        'js/modules/07-gallery.js',
        'js/modules/08-gallery-upload.js',
        'js/modules/09-categories.js',
        'js/modules/10-testimonials.js',
        'js/modules/11-stats.js',
        'js/modules/12-subscriptions.js'
    ];

    let loadedCount = 0;

    function loadScript(src, onload) {
        const script = document.createElement('script');
        script.src = src;
        script.onload = onload;
        script.onerror = () => console.error('Failed to load:', src);
        document.head.appendChild(script);
    }

    function loadNext() {
        if (loadedCount < modules.length) {
            loadScript(modules[loadedCount], () => {
                loadedCount++;
                loadNext();
            });
        } else {
            initApp();
        }
    }

    function initApp() {
        initAuth();
        initNavigation();
        initPosts();
        initImageUpload();
        initGallery();
        initCategories();
        initTestimonials();
        initStats();
    }

    // Start loading
    loadNext();
})();