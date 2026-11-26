/* ==========================================================================
   CineReview — Manage Movies Page Controller
   Owned by: Member 4 (Moneer Magdi)
   Page: pages/admin/manage-movies.html
   ========================================================================== */

import { requireRole } from '../session.js';
import { renderNavbar } from '../navbar.js';
import { showMessage } from '../utils.js';
import { confirmDialog } from '../dialog.js';
import { getAllMovies, deleteMovie } from '../movies.js';

const currentUser = requireRole(['admin', 'superAdmin']);

if (currentUser) {
    initManageMoviesPage();
}

function initManageMoviesPage() {
    const pageContent = document.getElementById('page-content');
    if (pageContent) {
        pageContent.hidden = false;
    }

    renderNavbar();
    renderMoviesTable();

    const tbody = document.getElementById('movies-table-body');
    if (tbody) {
        tbody.addEventListener('click', handleTableAction);
    }
}

function renderMoviesTable() {
    const tbody = document.getElementById('movies-table-body');
    const tableWrapper = document.getElementById('movies-table-wrapper');
    const emptyState = document.getElementById('movies-empty-state');
    const countText = document.getElementById('movies-count-text');

    if (!tbody) return;

    const movies = getAllMovies();
    if (countText) {
        countText.textContent = `${movies.length} Active ${movies.length === 1 ? 'Movie' : 'Movies'}`;
    }

    tbody.replaceChildren();

    if (movies.length === 0) {
        if (tableWrapper) tableWrapper.hidden = true;
        if (emptyState) emptyState.hidden = false;
        return;
    }

    if (tableWrapper) tableWrapper.hidden = false;
    if (emptyState) emptyState.hidden = true;

    for (const movie of movies) {
        tbody.appendChild(createMovieRow(movie));
    }
}

function createMovieRow(movie) {
    const tr = document.createElement('tr');
    tr.dataset.movieId = String(movie.id);

    // ID cell
    const idTd = document.createElement('td');
    idTd.className = 'rv-cell-id';
    idTd.textContent = `#${movie.id}`;

    // Title & Thumbnail cell
    const titleTd = document.createElement('td');
    const cellWrap = document.createElement('div');
    cellWrap.className = 'adm-movie-cell';

    const thumb = document.createElement('div');
    thumb.className = 'adm-table-thumb';
    thumb.textContent = getMonogram(movie.title);

    const metaDiv = document.createElement('div');
    const titleLink = document.createElement('a');
    titleLink.href = `../user/movie-detail.html?id=${encodeURIComponent(movie.id)}`;
    titleLink.className = 'adm-movie-meta-title';
    titleLink.textContent = movie.title;

    const subSpan = document.createElement('span');
    subSpan.className = 'adm-movie-meta-sub';
    subSpan.textContent = `${movie.genre} • ${movie.releaseYear}`;

    metaDiv.append(titleLink, subSpan);
    cellWrap.append(thumb, metaDiv);
    titleTd.appendChild(cellWrap);

    // Genre cell
    const genreTd = document.createElement('td');
    const genreBadge = document.createElement('span');
    genreBadge.className = 'badge badge--genre';
    genreBadge.textContent = movie.genre;
    genreTd.appendChild(genreBadge);

    // Release Year cell
    const yearTd = document.createElement('td');
    const yearStrong = document.createElement('strong');
    yearStrong.textContent = String(movie.releaseYear);
    yearTd.appendChild(yearStrong);

    // Director cell
    const directorTd = document.createElement('td');
    directorTd.textContent = movie.director;

    // Actions cell (View, Edit, Delete)
    const actionsTd = document.createElement('td');
    actionsTd.style.textAlign = 'right';

    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'adm-action-buttons';
    actionsWrap.style.justifyContent = 'flex-end';

    const viewLink = document.createElement('a');
    viewLink.href = `../user/movie-detail.html?id=${encodeURIComponent(movie.id)}`;
    viewLink.className = 'btn btn--secondary btn--sm';
    viewLink.textContent = 'View';

    const editLink = document.createElement('a');
    editLink.href = `edit-movie.html?id=${encodeURIComponent(movie.id)}`;
    editLink.className = 'adm-action-edit';
    editLink.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn--danger btn--sm';
    deleteBtn.dataset.action = 'delete';
    deleteBtn.dataset.id = String(movie.id);
    deleteBtn.textContent = 'Delete';

    actionsWrap.append(viewLink, editLink, deleteBtn);
    actionsTd.appendChild(actionsWrap);

    tr.append(idTd, titleTd, genreTd, yearTd, directorTd, actionsTd);
    return tr;
}

function handleTableAction(event) {
    const deleteBtn = event.target.closest('button[data-action="delete"]');
    if (!deleteBtn) return;

    const movieId = Number(deleteBtn.dataset.id);
    const movies = getAllMovies();
    const movie = movies.find((m) => Number(m.id) === movieId);
    if (!movie) return;

    confirmDialog({
        title: 'Delete Movie Record',
        message: `Are you sure you want to delete "${movie.title}" (${movie.releaseYear})? All reviews for this movie will be deleted too. This action cannot be undone.`,
        onConfirm: () => {
            const result = deleteMovie(movieId);
            const messageEl = document.getElementById('page-message');
            if (!result.ok) {
                if (messageEl) showMessage(messageEl, result.error, 'danger');
                return;
            }
            renderMoviesTable();
            if (messageEl) {
                showMessage(
                    messageEl,
                    `Deleted "${movie.title}" and ${result.deletedReviewsCount} associated review(s).`,
                    'success'
                );
            }
        }
    });
}

function getMonogram(title) {
    const words = String(title ?? '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'MOV';
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase();
}
