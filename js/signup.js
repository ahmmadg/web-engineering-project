(function (root) {
    'use strict';

    if (!root.movieReviewSessions ||
        typeof root.movieReviewSessions.redirectToHome !== 'function') {
        throw new Error('Load the movieReviewSessions module before using signup.');
    }
    if (root.movieReviewSessions.redirectToHome()) {
        return;
    }

    var form = root.document.getElementById('signup-form');
    var username = root.document.getElementById('username');
    var email = root.document.getElementById('email');
    var password = root.document.getElementById('password');
    var confirmation = root.document.getElementById('confirm_password');
    var role = root.document.getElementById('role');
    var message = root.document.getElementById('signup-message');

    function validatePasswordMatch() {
        confirmation.setCustomValidity(
            confirmation.value && confirmation.value !== password.value
                ? 'Passwords do not match.'
                : ''
        );
    }

    function clearDuplicateValidity(event) {
        event.currentTarget.setCustomValidity('');
    }

    function showSaveError(error) {
        message.textContent = 'Unable to save your account: ' + error.message;
        message.hidden = false;
    }

    [password, confirmation].forEach(function (field) {
        field.addEventListener('input', validatePasswordMatch);
        field.addEventListener('change', validatePasswordMatch);
    });

    [username, email].forEach(function (field) {
        field.addEventListener('input', clearDuplicateValidity);
    });
    role.addEventListener('change', function () {
        role.setCustomValidity('');
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        message.hidden = true;
        validatePasswordMatch();

        if (!form.reportValidity()) {
            return;
        }

        var normalizedUsername = username.value.trim().toLowerCase();
        var normalizedEmail = email.value.trim().toLowerCase();
        var users;

        try {
            users = root.movieReviewStorage.getAll('users');
        } catch (error) {
            showSaveError(error);
            return;
        }

        var usernameExists = users.some(function (user) {
            return user && typeof user.username === 'string' &&
                user.username.trim().toLowerCase() === normalizedUsername;
        });
        var emailExists = users.some(function (user) {
            return user && typeof user.email === 'string' &&
                user.email.trim().toLowerCase() === normalizedEmail;
        });

        username.setCustomValidity(usernameExists ? 'That username is already taken.' : '');
        email.setCustomValidity(emailExists ? 'That email address is already registered.' : '');

        if (!form.reportValidity()) {
            return;
        }

        if (role.value !== 'user' && role.value !== 'admin') {
            role.setCustomValidity('Choose User or Administrator.');
            form.reportValidity();
            return;
        }

        try {
            root.movieReviewStorage.insert('users', {
                username: username.value.trim(),
                email: email.value.trim().toLowerCase(),
                password: password.value,
                role: role.value
            });
        } catch (error) {
            showSaveError(error);
            return;
        }

        root.location.href = 'login.html';
    });
}(typeof globalThis !== 'undefined' ? globalThis : this));
