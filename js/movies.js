/* ==========================================================================
   CineReview — Movie Catalog Business Logic Module
   Owned by: Member 4 (Moneer Magdi)
   Depends on: storage.js (Student 1), sessions.js (Student 1)
   ========================================================================== */

import storage from './storage.js';
import { getCurrentUser } from './sessions.js';

const DIRECTOR_PATTERN = /^[A-Za-z .\-]+$/;
const MIN_YEAR = 1888;

/**
 * Verifies the currently signed-in user has admin or super_admin privileges.
 * @returns {{ ok: boolean, user?: Object, error?: string }}
 */
function requireAdminSession() {
    const user = getCurrentUser();
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        return { ok: false, error: 'Unauthorized: Administrator access is required.' };
    }
    return { ok: true, user };
}

/**
 * Checks whether a movie with the same title and release year already exists
 * (case-insensitive, trimmed), optionally skipping a record being edited.
 * @param {string} title
 * @param {number|string} releaseYear
 * @param {number|string|null} skipId
 * @returns {boolean}
 */
export function isDuplicateMovie(title, releaseYear, skipId = null) {
    const normalizedTitle = String(title ?? '').trim().toLowerCase();
    const yearNum = Number(releaseYear);
    const skipNum = skipId !== null && skipId !== undefined && skipId !== '' ? Number(skipId) : null;

    const matches = storage.find('movies', (movie) => {
        if (skipNum !== null && Number(movie.id) === skipNum) {
            return false;
        }
        return (
            String(movie.title ?? '').trim().toLowerCase() === normalizedTitle &&
            Number(movie.releaseYear) === yearNum
        );
    });

    return matches.length > 0;
}

/**
 * Validates and saves a movie record (insert when editId is null, update otherwise).
 * @param {Object} data
 * @param {number|string|null} editId
 * @returns {{ ok: boolean, movie?: Object, error?: string }}
 */
export function saveMovie(data, editId = null) {
    const auth = requireAdminSession();
    if (!auth.ok) {
        return auth;
    }

    const title = String(data?.title ?? '').trim();
    const genre = String(data?.genre ?? '').trim();
    const releaseYear = Number(data?.releaseYear);
    const director = String(data?.director ?? '').trim();
    const description = String(data?.description ?? '').trim();
    const maxYear = new Date().getFullYear() + 1;

    if (title.length < 1 || title.length > 100) {
        return { ok: false, error: 'Movie title must be between 1 and 100 characters.' };
    }
    if (!genre) {
        return { ok: false, error: 'Please select a primary genre.' };
    }
    if (!Number.isInteger(releaseYear) || releaseYear < MIN_YEAR || releaseYear > maxYear) {
        return { ok: false, error: `Release year must be a whole number between ${MIN_YEAR} and ${maxYear}.` };
    }
    if (!director || !DIRECTOR_PATTERN.test(director)) {
        return { ok: false, error: 'Director name may only contain letters, spaces, dots, and hyphens.' };
    }
    if (description.length < 20 || description.length > 1000) {
        return { ok: false, error: 'Description must be between 20 and 1000 characters.' };
    }

    if (isDuplicateMovie(title, releaseYear, editId)) {
        return { ok: false, error: `A movie titled "${title}" (${releaseYear}) already exists in the catalog.` };
    }

    const hasEditId = editId !== null && editId !== undefined && editId !== '';
    if (hasEditId) {
        const numericId = Number(editId);
        const existing = storage.getById('movies', numericId);
        if (!existing) {
            return { ok: false, error: 'Movie record could not be found.' };
        }
        const updated = storage.update('movies', numericId, {
            title,
            genre,
            releaseYear,
            director,
            description
        });
        return { ok: true, movie: updated };
    }

    const created = storage.insert('movies', {
        title,
        genre,
        releaseYear,
        director,
        description,
        createdBy: auth.user.userId
    });
    return { ok: true, movie: created };
}

/**
 * Deletes a movie by ID and cascade-deletes all reviews associated with that movie.
 * @param {number|string} id
 * @returns {{ ok: boolean, deletedReviewsCount?: number, error?: string }}
 */
export function deleteMovie(id) {
    const auth = requireAdminSession();
    if (!auth.ok) {
        return auth;
    }

    const movieId = Number(id);
    const existing = storage.getById('movies', movieId);
    if (!existing) {
        return { ok: false, error: 'Movie record could not be found.' };
    }

    const relatedReviews = storage.find('reviews', (review) => Number(review.movieId) === movieId);
    for (const review of relatedReviews) {
        storage.remove('reviews', review.id);
    }

    storage.remove('movies', movieId);
    return { ok: true, deletedReviewsCount: relatedReviews.length };
}

/**
 * Returns all movies currently stored via storage.js.
 * @returns {Array<Object>}
 */
export function getAllMovies() {
    return storage.getAll('movies');
}
