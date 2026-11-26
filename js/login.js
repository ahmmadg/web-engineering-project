(function (root) {
    'use strict';

    if (!root.movieReviewSessions ||
        typeof root.movieReviewSessions.redirectToHome !== 'function') {
        throw new Error('Load the movieReviewSessions module before using login.');
    }
    if (root.movieReviewSessions.redirectToHome()) {
        return;
    }

    var form = root.document.getElementById('login-form');
    var username = root.document.getElementById('identifier');
    var password = root.document.getElementById('password');
    var errorMessage = root.document.getElementById('login-error');

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        errorMessage.hidden = true;

        var authenticated;
        try {
            authenticated = root.movieReviewSessions.login(
                username.value.trim(),
                password.value
            );
        } catch (error) {
            errorMessage.textContent = 'Unable to log in: ' + error.message;
            errorMessage.hidden = false;
            return;
        }

        if (!authenticated) {
            errorMessage.textContent = 'Invalid username or password';
            errorMessage.hidden = false;
            return;
        }

        root.movieReviewSessions.redirectToHome();
    });
}(typeof globalThis !== 'undefined' ? globalThis : this));
