/* ==========================================================================
   CineReview — Super Admin: Manage Admins Page Controller
   Owned by: Member 4 (Moneer Magdi)
   Page: pages/admin/manage-admins.html
   ========================================================================== */

import { requireRole } from '../session.js';
import { renderNavbar } from '../navbar.js';
import { getAll, getById, update, remove, find } from '../storage.js';
import { showMessage } from '../utils.js';
import { confirmDialog } from '../dialog.js';

const currentUser = requireRole(['superAdmin']);

if (currentUser) {
    initManageAdminsPage();
}

function initManageAdminsPage() {
    const pageContent = document.getElementById('page-content');
    if (pageContent) {
        pageContent.hidden = false;
    }

    renderNavbar();
    renderTables();

    const adminsBody = document.getElementById('admins-table-body');
    const usersBody = document.getElementById('users-table-body');

    if (adminsBody) {
        adminsBody.addEventListener('click', handleAdminAction);
    }
    if (usersBody) {
        usersBody.addEventListener('click', handleUserAction);
    }
}

function renderTables() {
    const users = getAll('users');
    const admins = users.filter((u) => u.role === 'admin');
    const standardUsers = users.filter((u) => u.role === 'user');

    const countEl = document.getElementById('admins-count-text');
    if (countEl) {
        countEl.textContent = `${admins.length} ${admins.length === 1 ? 'Administrator' : 'Administrators'}`;
    }

    renderAdminsTable(admins);
    renderUsersTable(standardUsers);
}

function renderAdminsTable(admins) {
    const tbody = document.getElementById('admins-table-body');
    const wrapper = document.getElementById('admins-table-wrapper');
    const empty = document.getElementById('admins-empty-state');
    if (!tbody) return;

    tbody.replaceChildren();

    if (admins.length === 0) {
        if (wrapper) wrapper.hidden = true;
        if (empty) empty.hidden = false;
        return;
    }

    if (wrapper) wrapper.hidden = false;
    if (empty) empty.hidden = true;

    for (const admin of admins) {
        const tr = document.createElement('tr');

        const idTd = document.createElement('td');
        idTd.className = 'rv-cell-id';
        idTd.textContent = `#${admin.id}`;

        const userTd = document.createElement('td');
        userTd.className = 'rv-cell-user';
        userTd.textContent = admin.username;

        const emailTd = document.createElement('td');
        emailTd.textContent = admin.email;

        const roleTd = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge badge--admin';
        badge.textContent = 'Admin';
        roleTd.appendChild(badge);

        const actionsTd = document.createElement('td');
        actionsTd.style.textAlign = 'right';

        const actionsWrap = document.createElement('div');
        actionsWrap.className = 'adm-action-buttons';
        actionsWrap.style.justifyContent = 'flex-end';

        const demoteBtn = document.createElement('button');
        demoteBtn.type = 'button';
        demoteBtn.className = 'btn btn--secondary btn--sm';
        demoteBtn.dataset.action = 'demote';
        demoteBtn.dataset.id = String(admin.id);
        demoteBtn.textContent = 'Demote to User';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'btn btn--danger btn--sm';
        deleteBtn.dataset.action = 'delete-admin';
        deleteBtn.dataset.id = String(admin.id);
        deleteBtn.textContent = 'Delete Admin';

        actionsWrap.append(demoteBtn, deleteBtn);
        actionsTd.appendChild(actionsWrap);

        tr.append(idTd, userTd, emailTd, roleTd, actionsTd);
        tbody.appendChild(tr);
    }
}

function renderUsersTable(standardUsers) {
    const tbody = document.getElementById('users-table-body');
    const wrapper = document.getElementById('users-table-wrapper');
    const empty = document.getElementById('users-empty-state');
    if (!tbody) return;

    tbody.replaceChildren();

    if (standardUsers.length === 0) {
        if (wrapper) wrapper.hidden = true;
        if (empty) empty.hidden = false;
        return;
    }

    if (wrapper) wrapper.hidden = false;
    if (empty) empty.hidden = true;

    for (const user of standardUsers) {
        const tr = document.createElement('tr');

        const idTd = document.createElement('td');
        idTd.className = 'rv-cell-id';
        idTd.textContent = `#${user.id}`;

        const userTd = document.createElement('td');
        userTd.className = 'rv-cell-user';
        userTd.textContent = user.username;

        const emailTd = document.createElement('td');
        emailTd.textContent = user.email;

        const roleTd = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = 'badge badge--user';
        badge.textContent = 'User';
        roleTd.appendChild(badge);

        const actionsTd = document.createElement('td');
        actionsTd.style.textAlign = 'right';

        const promoteBtn = document.createElement('button');
        promoteBtn.type = 'button';
        promoteBtn.className = 'btn btn--primary btn--sm';
        promoteBtn.dataset.action = 'promote';
        promoteBtn.dataset.id = String(user.id);
        promoteBtn.textContent = 'Promote to Admin';

        actionsTd.appendChild(promoteBtn);
        tr.append(idTd, userTd, emailTd, roleTd, actionsTd);
        tbody.appendChild(tr);
    }
}

function handleAdminAction(event) {
    const btn = event.target.closest('button[data-action]');
    if (!btn) return;

    const action = btn.dataset.action;
    const targetId = Number(btn.dataset.id);
    const messageEl = document.getElementById('admins-message');

    if (action === 'demote') {
        const result = demoteAdmin(targetId);
        if (messageEl) {
            showMessage(messageEl, result.message, result.ok ? 'success' : 'danger');
        }
        renderTables();
        return;
    }

    if (action === 'delete-admin') {
        const target = getById('users', targetId);
        if (!target || target.role !== 'admin' || Number(target.id) === Number(currentUser.id)) {
            if (messageEl) showMessage(messageEl, 'Cannot delete this account.', 'danger');
            return;
        }

        confirmDialog({
            title: 'Delete Administrator',
            message: `Are you sure you want to delete administrator "${target.username}"? Movies created by this admin will stay in storage, and any reviews they wrote will be removed.`,
            onConfirm: () => {
                const result = deleteAdminAccount(targetId);
                if (messageEl) {
                    showMessage(messageEl, result.message, result.ok ? 'success' : 'danger');
                }
                renderTables();
            }
        });
    }
}

function handleUserAction(event) {
    const btn = event.target.closest('button[data-action="promote"]');
    if (!btn) return;

    const targetId = Number(btn.dataset.id);
    const result = promoteUser(targetId);
    const messageEl = document.getElementById('admins-message');
    if (messageEl) {
        showMessage(messageEl, result.message, result.ok ? 'success' : 'danger');
    }
    renderTables();
}

function promoteUser(userId) {
    if (currentUser.role !== 'superAdmin') {
        return { ok: false, message: 'Unauthorized: Super Admin access required.' };
    }
    const target = getById('users', userId);
    if (!target || target.role !== 'user') {
        return { ok: false, message: 'Only standard users can be promoted to Admin.' };
    }
    update('users', userId, { role: 'admin' });
    return { ok: true, message: `Promoted "${target.username}" to Administrator.` };
}

function demoteAdmin(adminId) {
    if (currentUser.role !== 'superAdmin') {
        return { ok: false, message: 'Unauthorized: Super Admin access required.' };
    }
    const target = getById('users', adminId);
    if (!target || target.role !== 'admin' || Number(target.id) === Number(currentUser.id)) {
        return { ok: false, message: 'Only regular admin accounts can be demoted.' };
    }
    update('users', adminId, { role: 'user' });
    return { ok: true, message: `Demoted "${target.username}" to standard User.` };
}

function deleteAdminAccount(adminId) {
    if (currentUser.role !== 'superAdmin') {
        return { ok: false, message: 'Unauthorized: Super Admin access required.' };
    }
    const target = getById('users', adminId);
    if (!target || target.role !== 'admin' || Number(target.id) === Number(currentUser.id)) {
        return { ok: false, message: 'Only regular admin accounts can be deleted here.' };
    }

    // Assumption: movies created by a deleted admin stay in storage (createdBy kept).
    // Clean up any reviews authored by this account.
    const userReviews = find('reviews', (review) => Number(review.userId) === Number(adminId));
    for (const review of userReviews) {
        remove('reviews', review.id);
    }

    remove('users', adminId);
    return { ok: true, message: `Deleted administrator "${target.username}". Their created movies remain in the catalog.` };
}
