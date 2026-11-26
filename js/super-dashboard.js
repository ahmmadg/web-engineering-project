(function (root) {
    'use strict';

    var storage = root.movieReviewStorage;
    if (!storage || typeof storage.getAll !== 'function') {
        throw new Error('Load the movieReviewStorage module before the super-admin dashboard.');
    }

    function normalizeRole(role) {
        if (typeof role !== 'string') {
            return '';
        }

        var normalized = role.toLowerCase().replace(/[\s-]+/g, '_');
        return normalized === 'superadmin' ? 'super_admin' : normalized;
    }

    function countReviewsByStatus(reviews, status) {
        return reviews.filter(function (review) {
            var reviewStatus = review && (review.status || review.reviewStatus);
            return typeof reviewStatus === 'string' &&
                reviewStatus.trim().toLowerCase() === status;
        }).length;
    }

    function setCount(id, count) {
        var element = root.document.getElementById(id);
        if (!element) {
            throw new Error('Missing dashboard count element: ' + id);
        }

        element.textContent = String(count);
    }

    var users = storage.getAll('users');
    var movies = storage.getAll('movies');
    var reviews = storage.getAll('reviews');

    setCount('users-count', users.filter(function (user) {
        return user && normalizeRole(user.role) === 'user';
    }).length);
    setCount('admins-count', users.filter(function (user) {
        var role = user && normalizeRole(user.role);
        return role === 'admin' || role === 'super_admin';
    }).length);
    setCount('movies-count', movies.length);
    setCount('pending-reviews-count', countReviewsByStatus(reviews, 'pending'));
    setCount('approved-reviews-count', countReviewsByStatus(reviews, 'approved'));
    setCount('rejected-reviews-count', countReviewsByStatus(reviews, 'rejected'));
}(typeof globalThis !== 'undefined' ? globalThis : this));
