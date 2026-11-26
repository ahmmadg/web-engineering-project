import storage from './storage.js';

const SESSION_KEY = 'movieReview_session';
const appRoot = new URL('../', import.meta.url);
const ROLE_HOME = {
        admin: 'pages/admin/manage-movies.html',
        super_admin: 'pages/super-dashboard.html',
        user: 'pages/user/movies-list.html'
    };

export function normalizeRole(role) {
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
        if (!globalThis.sessionStorage) {
            throw new Error('sessionStorage is not available.');
        }
        return globalThis.sessionStorage;
    }

    function getUsers() {
        return storage.getAll('users');
    }

    function seedSuperAdmin() {
        var users = getUsers();
        var hasSuperAdmin = users.some(function (user) {
            return user && normalizeRole(user.role) === 'super_admin';
        });

        if (!hasSuperAdmin) {
            storage.insert('users', {
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

export function redirectToHome() {
        var currentUser = getCurrentUser();
        if (!currentUser) {
            return false;
        }

        navigate(getOwnHome(currentUser.role));
        return true;
    }

    function navigate(path) {
        var destination = appRoot ? new URL(path, appRoot).href : path;
        if (globalThis.location && typeof globalThis.location.assign === 'function') {
            globalThis.location.assign(destination);
            return;
        }

        if (globalThis.location) {
            globalThis.location.href = destination;
        }
    }

    function concealDocument() {
        if (!globalThis.document || !globalThis.document.documentElement) {
            return null;
        }

        var element = globalThis.document.documentElement;
        var previousVisibility = element.style.visibility;
        element.style.visibility = 'hidden';

        return function () {
            element.style.visibility = previousVisibility;
        };
    }

export function login(username, password) {
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

export function logout() {
        getSessionStorage().clear();
    }

export function getCurrentUser() {
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

export function requireRole(allowedRoles) {
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

export const sessions = {
    login,
    logout,
    getCurrentUser,
    redirectToHome,
    requireRole
};

if (globalThis.document) {
    seedSuperAdmin();
}

export default sessions;