/* ==========================================================================
   CineReview — Add & Edit Movie Form Controller
   Owned by: Member 4 (Moneer Magdi)
   Pages: pages/admin/add-movie.html, pages/admin/edit-movie.html
   ========================================================================== */

import { requireRole } from '../sessions.js';
import '../navbar.js';
import storage from '../storage.js';
import { nextYear, showMessage } from '../utils.js';
import { confirmDialog } from '../dialog.js';
import { saveMovie, deleteMovie } from '../movies.js';

const authorized = requireRole(['admin', 'super_admin']);

if (authorized) {
    initMovieFormPage();
}

function initMovieFormPage() {
    const pageContent = document.getElementById('page-content');
    if (pageContent) {
        pageContent.hidden = false;
    }

    const form = document.getElementById('movie-form');
    const messageEl = document.getElementById('form-message');
    const yearInput = document.getElementById('release-year');
    const deleteBtn = document.getElementById('delete-movie-btn');

    if (yearInput) {
        yearInput.max = String(nextYear()).slice(0, 4);
    }

    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    const isEditMode = document.body.dataset.mode === 'edit' || idParam !== null;

    let editId = null;

    if (isEditMode) {
        if (!idParam || Number.isNaN(Number(idParam))) {
            disableForm(form, deleteBtn);
            if (messageEl) {
                showMessage(messageEl, 'Missing or invalid movie ID in the URL. Please select a movie from Manage Movies.', 'danger');
            }
            return;
        }

        const numericId = Number(idParam);
        const movie = storage.getById('movies', numericId);
        if (!movie) {
            disableForm(form, deleteBtn);
            if (messageEl) {
                showMessage(messageEl, `Movie #${numericId} was not found in storage.`, 'danger');
            }
            return;
        }

        editId = numericId;
        populateEditForm(movie);

        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                confirmDialog({
                    title: 'Delete Movie Record',
                    message: `Are you sure you want to delete "${movie.title}" (${movie.releaseYear})? All reviews for this movie will be deleted too. This action cannot be undone.`,
                    onConfirm: () => {
                        const result = deleteMovie(editId);
                        if (!result.ok) {
                            if (messageEl) showMessage(messageEl, result.error, 'danger');
                            return;
                        }
                        window.location.href = 'manage-movies.html';
                    }
                });
            });
        }
    }

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();

            if (!form.reportValidity()) {
                return;
            }

            const payload = {
                title: document.getElementById('movie-title')?.value ?? '',
                genre: document.getElementById('movie-genre')?.value ?? '',
                releaseYear: document.getElementById('release-year')?.value ?? '',
                director: document.getElementById('movie-director')?.value ?? '',
                description: document.getElementById('movie-description')?.value ?? ''
            };

            const result = saveMovie(payload, editId);
            if (!result.ok) {
                if (messageEl) {
                    showMessage(messageEl, result.error, 'danger');
                }
                return;
            }

            window.location.href = 'manage-movies.html';
        });
    }
}

function populateEditForm(movie) {
    const idInput = document.getElementById('movie-id');
    const titleInput = document.getElementById('movie-title');
    const genreSelect = document.getElementById('movie-genre');
    const yearInput = document.getElementById('release-year');
    const directorInput = document.getElementById('movie-director');
    const descInput = document.getElementById('movie-description');

    if (idInput) idInput.value = `#${movie.id}`;
    if (titleInput) titleInput.value = movie.title ?? '';
    if (genreSelect) genreSelect.value = movie.genre ?? '';
    if (yearInput) yearInput.value = String(movie.releaseYear ?? '');
    if (directorInput) directorInput.value = movie.director ?? '';
    if (descInput) descInput.value = movie.description ?? '';

    const heading = document.getElementById('edit-movie-heading');
    const breadcrumbCurrent = document.getElementById('edit-breadcrumb-current');
    const idTag = document.getElementById('edit-id-tag');
    const viewLiveBtn = document.getElementById('view-live-btn');
    const previewTitle = document.getElementById('preview-title');
    const previewMeta = document.getElementById('preview-meta');

    if (heading) heading.textContent = `Edit Movie: ${movie.title}`;
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = `Edit Movie (#${movie.id})`;
    if (idTag) idTag.textContent = `Editing Record #${movie.id}`;
    if (viewLiveBtn) viewLiveBtn.href = `../user/movie-detail.html?id=${encodeURIComponent(movie.id)}`;
    if (previewTitle) previewTitle.textContent = movie.title;
    if (previewMeta) previewMeta.textContent = `${movie.releaseYear} • ${movie.genre}`;
}

function disableForm(form, deleteBtn) {
    if (form) {
        const controls = form.querySelectorAll('input, select, textarea, button');
        for (const control of controls) {
            control.disabled = true;
        }
    }
    if (deleteBtn) {
        deleteBtn.disabled = true;
    }
}
