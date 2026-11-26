import storage from './storage.js';
import * as sessions from './sessions.js';

if (!sessions.redirectToHome()) {
    var form = document.getElementById('signup-form');
    var username = document.getElementById('username');
    var email = document.getElementById('email');
    var password = document.getElementById('password');
    var confirmation = document.getElementById('confirm_password');
    var passwordMatchError = document.getElementById('password-match-error');
    var usernameError = document.getElementById('username-error');
    var emailError = document.getElementById('email-error');
    var role = document.getElementById('role');
    var message = document.getElementById('signup-message');
    var submitButton = form.querySelector('button[type="submit"]');

    function validatePasswordMatch() {
        var passwordsDoNotMatch = confirmation.value && confirmation.value !== password.value;
        var error = passwordsDoNotMatch ? 'Passwords do not match.' : '';

        confirmation.setCustomValidity(error);
        passwordMatchError.textContent = error;
        passwordMatchError.hidden = !error;
        confirmation.setAttribute('aria-invalid', error ? 'true' : 'false');
    }

    function validateUniqueAccountDetails() {
        username.setCustomValidity('');
        email.setCustomValidity('');
        usernameError.textContent = '';
        emailError.textContent = '';
        usernameError.hidden = true;
        emailError.hidden = true;

        var usernameIsValid = username.validity.valid;
        var emailIsValid = email.validity.valid;
        if (!usernameIsValid && !emailIsValid) {
            return true;
        }

        var users;
        try {
            users = storage.getAll('users');
            message.hidden = true;
        } catch (error) {
            showSaveError(error);
            return false;
        }

        var normalizedUsername = username.value.trim().toLowerCase();
        var normalizedEmail = email.value.trim().toLowerCase();
        var usernameExists = usernameIsValid && users.some(function (user) {
            return user && typeof user.username === 'string' &&
                user.username.trim().toLowerCase() === normalizedUsername;
        });
        var emailExists = emailIsValid && users.some(function (user) {
            return user && typeof user.email === 'string' &&
                user.email.trim().toLowerCase() === normalizedEmail;
        });

        if (usernameExists) {
            usernameError.textContent = 'That username is already taken.';
            usernameError.hidden = false;
            username.setCustomValidity(usernameError.textContent);
        }
        if (emailExists) {
            emailError.textContent = 'That email address is already registered.';
            emailError.hidden = false;
            email.setCustomValidity(emailError.textContent);
        }

        return true;
    }

    function updateSubmitButton() {
        validatePasswordMatch();
        var accountDetailsAvailable = validateUniqueAccountDetails();
        role.setCustomValidity(
            role.value !== 'user' && role.value !== 'admin'
                ? 'Choose User or Administrator.'
                : ''
        );
        submitButton.disabled = !accountDetailsAvailable || !form.checkValidity();
    }

    function showSaveError(error) {
        message.textContent = 'Unable to save your account: ' + error.message;
        message.hidden = false;
    }

    [password, confirmation].forEach(function (field) {
        field.addEventListener('input', validatePasswordMatch);
        field.addEventListener('change', validatePasswordMatch);
    });

    form.addEventListener('input', updateSubmitButton);
    form.addEventListener('change', updateSubmitButton);
    updateSubmitButton();

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        message.hidden = true;
        updateSubmitButton();

        if (submitButton.disabled || !form.reportValidity()) {
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
