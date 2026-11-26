import storage from './storage.js';
import * as sessions from './sessions.js';

const appRoot = new URL('../', import.meta.url);

const linksByRole = {
        guest: [
            { label: 'Home', path: 'index.html' },
            { label: 'Login', path: 'pages/auth/login.html' },
            { label: 'Sign up', path: 'pages/auth/signup.html' }
        ],
        user: [
            { label: 'Movies', path: 'pages/user/movies-list.html' },
            { label: 'My reviews', path: 'pages/user/my-reviews.html' }
        ],
        admin: [
            { label: 'Movies', path: 'pages/admin/manage-movies.html' },
            { label: 'Add Movie', path: 'pages/admin/add-movie.html' },
            { label: 'Manage reviews', path: 'pages/admin/manage-reviews.html' }
        ],
        super_admin: [
            { label: 'Dashboard', path: 'pages/super-dashboard.html' },
            { label: 'Users', path: 'pages/admin/manage-users.html' },
            { label: 'Admins', path: 'pages/admin/manage-admins.html' },
            { label: 'Reviews', path: 'pages/admin/manage-reviews.html' },
            { label: 'Movies', path: 'pages/admin/manage-movies.html' }
        ]
    };
const homepageByRole = {
        user: { label: 'Go to Movies', path: 'pages/user/movies-list.html' },
        admin: { label: 'Admin Dashboard', path: 'pages/admin/dashboard.html' },
        super_admin: { label: 'Super Admin Dashboard', path: 'pages/super-dashboard.html' }
    };

    function renderHomepageLinks(currentUser) {
        var primaryLink = document.getElementById('homepage-primary-link');
        var secondaryLink = document.getElementById('homepage-secondary-link');

        if (!primaryLink || !secondaryLink) {
            return;
        }

        if (!currentUser) {
            primaryLink.href = new URL('pages/auth/signup.html', appRoot).href;
            primaryLink.textContent = 'Join CineReview — Sign Up Free';
            secondaryLink.href = new URL('pages/auth/login.html', appRoot).href;
            secondaryLink.textContent = 'Log In';
            secondaryLink.hidden = false;
            return;
        }

        var destination = homepageByRole[currentUser.role];
        if (!destination) {
            return;
        }

        primaryLink.href = new URL(destination.path, appRoot).href;
        primaryLink.textContent = destination.label;
        secondaryLink.hidden = true;
    }

    function createLink(link, currentPath) {
        var anchor = document.createElement('a');
        anchor.href = new URL(link.path, appRoot).href;
        anchor.textContent = link.label;
        if (new URL(anchor.href).pathname === currentPath) {
            anchor.className = 'active';
            anchor.setAttribute('aria-current', 'page');
        }
        return anchor;
    }

    function getDisplayName(currentUser) {
        if (typeof storage.getById !== 'function') {
            return 'User';
        }
        var user = storage.getById('users', currentUser.userId);
        return user && (user.username || user.name || user.email) || 'User';
    }

    function createNavbar(currentUser) {
        var documentObject = document;
        var role = currentUser ? currentUser.role : 'guest';
        var navbar = documentObject.createElement('header');
        navbar.className = 'navbar';
        if (role === 'admin' || role === 'super_admin') {
            navbar.classList.add('navbar--admin');
        }

        var logo = documentObject.createElement('a');
        logo.className = 'logo';
        logo.href = new URL('index.html', appRoot).href;
        logo.textContent = 'CineReview';
        navbar.appendChild(logo);

        var nav = documentObject.createElement('nav');
        nav.className = 'nav-links';
        nav.setAttribute('aria-label', 'Main navigation');
        linksByRole[role].forEach(function (link) {
            nav.appendChild(createLink(link, globalThis.location.pathname));
        });
        navbar.appendChild(nav);

        var actions = documentObject.createElement('div');
        actions.className = 'user-nav-actions';
        if (currentUser) {
            var username = documentObject.createElement('span');
            username.className = 'user-profile-badge';
            username.textContent = getDisplayName(currentUser);
            actions.appendChild(username);

            var logout = documentObject.createElement('a');
            logout.className = 'nav-logout-btn';
            logout.href = new URL('pages/auth/login.html', appRoot).href;
            logout.textContent = 'Logout';
            logout.addEventListener('click', function (event) {
                if (typeof sessions.logout !== 'function') {
                    throw new Error('The movieReviewSessions module cannot log out.');
                }

                event.preventDefault();
                sessions.logout();
                globalThis.location.href = new URL('pages/auth/login.html', appRoot).href;
            });
            actions.appendChild(logout);
        }
        navbar.appendChild(actions);

        return navbar;
    }

    function render() {
        var currentUser = typeof sessions.getCurrentUser === 'function'
            ? sessions.getCurrentUser()
            : null;
        var oldNavbar = document.querySelector('header.navbar');
        var navbar = createNavbar(currentUser);

        if (oldNavbar) {
            oldNavbar.replaceWith(navbar);
        } else {
            document.body.insertBefore(navbar, document.body.firstChild);
        }

        document.querySelectorAll('.navbar-eval-bar').forEach(function (strip) {
            strip.remove();
        });

        renderHomepageLinks(currentUser);
        return navbar;
    }

export { render };

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render, { once: true });
} else {
    render();
}