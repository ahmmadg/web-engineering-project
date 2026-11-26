import storage from './storage.js';
import * as sessions from './sessions.js';

if (!sessions.redirectToHome()) {
    var form = document.getElementById('signup-form');
    var username = document.getElementById('username');
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    var confirmation = document.getElementById('confirm_password');
    var role = document.getElementById('role');
    var message = document.getElementById('signup-message');

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
            users = storage.getAll('users');
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
            storage.insert('users', {
                username: username.value.trim(),
                email: email.value.trim().toLowerCase(),
                password: password.value,
                role: role.value
            });
        } catch (error) {
            showSaveError(error);
            return;
        }

        globalThis.location.href = 'login.html';
    });
}
