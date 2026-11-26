/* ==========================================================================
   CineReview — Shared Confirmation Dialog Module
   Owned by: Member 4 (Moneer Magdi)
   Built on native HTML <dialog>. Zero external dependencies.
   ========================================================================== */

let activeController = null;

/**
 * Ensures the singleton confirmation <dialog> exists in the DOM.
 * Built strictly with DOM creation and textContent (no innerHTML).
 * @returns {HTMLDialogElement}
 */
function ensureDialogElement() {
    let dialog = document.getElementById('adm-confirm-dialog');
    if (dialog) {
        return dialog;
    }

    dialog = document.createElement('dialog');
    dialog.id = 'adm-confirm-dialog';
    dialog.className = 'adm-dialog';
    dialog.setAttribute('aria-labelledby', 'adm-dialog-title');
    dialog.setAttribute('aria-describedby', 'adm-dialog-message');

    const card = document.createElement('div');
    card.className = 'adm-dialog-card';

    const header = document.createElement('div');
    header.className = 'adm-dialog-header';

    const titleEl = document.createElement('h2');
    titleEl.id = 'adm-dialog-title';
    titleEl.className = 'adm-dialog-title';

    header.appendChild(titleEl);

    const body = document.createElement('p');
    body.id = 'adm-dialog-message';
    body.className = 'adm-dialog-message';

    const actions = document.createElement('div');
    actions.className = 'adm-dialog-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'adm-dialog-cancel';
    cancelBtn.className = 'btn btn--secondary';
    cancelBtn.textContent = 'Cancel';

    const confirmBtn = document.createElement('button');
    confirmBtn.type = 'button';
    confirmBtn.id = 'adm-dialog-confirm';
    confirmBtn.className = 'btn btn--danger';
    confirmBtn.textContent = 'Confirm Delete';

    actions.append(cancelBtn, confirmBtn);
    card.append(header, body, actions);
    dialog.appendChild(card);
    document.body.appendChild(dialog);

    return dialog;
}

/**
 * Displays a confirmation modal using the native <dialog> element.
 * @param {Object} options
 * @param {string} options.title - Modal heading text.
 * @param {string} options.message - Warning / confirmation details.
 * @param {Function} options.onConfirm - Callback executed when confirmed.
 */
export function confirmDialog({ title = 'Confirm Action', message = 'Are you sure?', onConfirm } = {}) {
    const dialog = ensureDialogElement();
    const titleEl = document.getElementById('adm-dialog-title');
    const messageEl = document.getElementById('adm-dialog-message');
    const cancelBtn = document.getElementById('adm-dialog-cancel');
    const confirmBtn = document.getElementById('adm-dialog-confirm');

    titleEl.textContent = title;
    messageEl.textContent = message;

    if (activeController) {
        activeController.abort();
    }
    activeController = new AbortController();
    const { signal } = activeController;

    const closeDialog = () => {
        if (dialog.open) {
            dialog.close();
        }
        if (activeController) {
            activeController.abort();
            activeController = null;
        }
    };

    cancelBtn.addEventListener('click', closeDialog, { signal });

    confirmBtn.addEventListener('click', () => {
        closeDialog();
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    }, { signal });

    dialog.addEventListener('click', (event) => {
        if (event.target === dialog) {
            closeDialog();
        }
    }, { signal });

    dialog.addEventListener('cancel', () => {
        if (activeController) {
            activeController.abort();
            activeController = null;
        }
    }, { signal });

    if (typeof dialog.showModal === 'function') {
        dialog.showModal();
        cancelBtn.focus();
    }
}
