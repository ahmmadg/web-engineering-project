(function (root) {
    'use strict';

    var SESSION_KEY = 'movieReview_session';
    var sessionScript = root.document && root.document.currentScript;
    var appRoot = sessionScript ? new URL('../', sessionScript.src) : null;
    var ROLE_HOME = {
        admin: 'pages/admin/manage-movies.html',
        super_admin: 'pages/super-dashboard.html',
        user: 'pages/user/movies-list.html'
    };

    function normalizeRole(role) {
        if (typeof role !== 'string') {
            return null;
        }

        var normalized = role.toLowerCase().replace(/[\s-]+/g, '_');
        if (normalized === 'superadmin') {
            normalized = 'super_admin';
        }

        return normalized === 'user' || normalized === 'admin' ||
            normalized === 'super_admin' ? normalized : null;
    }

    function getSessionStorage() {
        if (!root.sessionStorage) {
            throw new Error('sessionStorage is not available.');
        }

        return root.sessionStorage;
    }

    function getUsers() {
        if (!root.movieReviewStorage || typeof root.movieReviewStorage.getAll !== 'function') {
            throw new Error('Load the movieReviewStorage module before using sessions.');
        }

        return root.movieReviewStorage.getAll('users');
    }

    function seedSuperAdmin() {
        var users = getUsers();
        var hasSuperAdmin = users.some(function (user) {
            return user && normalizeRole(user.role) === 'super_admin';
        });

        if (!hasSuperAdmin) {
            root.movieReviewStorage.insert('users', {
                username: 'superAdmin',
                email: 'superadmin@cinereview.local',
                password: 'SuperAdmin123',
                role: 'superAdmin'
            });
        }
    }

    function getOwnHome(role) {
        return ROLE_HOME[role] || ROLE_HOME.user;
    }

    function redirectToHome() {
        var currentUser = getCurrentUser();
        if (!currentUser) {
            return false;
        }

        navigate(getOwnHome(currentUser.role));
        return true;
    }

    function navigate(path) {
        var destination = appRoot ? new URL(path, appRoot).href : path;
        if (root.location && typeof root.location.assign === 'function') {
            root.location.assign(destination);
            return;
        }

        if (root.location) {
            root.location.href = destination;
        }
    }

    function concealDocument() {
        if (!root.document || !root.document.documentElement) {
            return null;
        }

        var element = root.document.documentElement;
        var previousVisibility = element.style.visibility;
        element.style.visibility = 'hidden';

        return function () {
            element.style.visibility = previousVisibility;
        };
    }

    function login(username, password) {
        if (typeof username !== 'string' || typeof password !== 'string') {
            throw new TypeError('Username and password must be strings.');
        }

        var normalizedUsername = username.trim().toLowerCase();
        var user = getUsers().find(function (candidate) {
            var candidateUsername = candidate && (candidate.username || candidate.email);
            return typeof candidateUsername === 'string' &&
                candidateUsername.toLowerCase() === normalizedUsername &&
                candidate.password === password;
        });

        var role = user && normalizeRole(user.role);
        if (!user || !role) {
            return false;
        }

        var userId = user.userId !== undefined ? user.userId : user.id;
        if (userId === undefined || userId === null) {
            throw new Error('The matching user record has no user ID.');
        }

        getSessionStorage().setItem(SESSION_KEY, JSON.stringify({
            userId: userId,
            role: role
        }));

        return true;
    }

    function logout() {
        getSessionStorage().clear();
    }

    function getCurrentUser() {
        var serialized = getSessionStorage().getItem(SESSION_KEY);
        if (!serialized) {
            return null;
        }

        try {
            var session = JSON.parse(serialized);
            var role = session && normalizeRole(session.role);
            if (!session || session.userId === undefined || !role) {
                return null;
            }

            return {
                userId: session.userId,
                role: role
            };
        } catch (error) {
            return null;
        }
    }

    function requireRole(allowedRoles) {
        if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
            throw new TypeError('Allowed roles must be a non-empty array.');
        }

        var revealDocument = concealDocument();
        var currentUser = getCurrentUser();

        if (!currentUser) {
            navigate('pages/auth/login.html');
            return false;
        }

        if (!allowedRoles.map(normalizeRole).includes(currentUser.role)) {
            navigate(getOwnHome(currentUser.role));
            return false;
        }

        if (revealDocument) {
            revealDocument();
        }

        return true;
    }

    var sessions = {
        login: login,
        logout: logout,
        getCurrentUser: getCurrentUser,
        redirectToHome: redirectToHome,
        requireRole: requireRole
    };

    root.movieReviewSessions = sessions;
    if (root.document && root.movieReviewStorage &&
        typeof root.movieReviewStorage.getAll === 'function' &&
        typeof root.movieReviewStorage.insert === 'function') {
        seedSuperAdmin();
    }

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = sessions;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this));