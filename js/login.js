import * as sessions from './sessions.js';

if (!sessions.redirectToHome()) {
    var form = document.getElementById('login-form');
    var username = document.getElementById('identifier');
    var password = document.getElementById('password');
    var errorMessage = document.getElementById('login-error');

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        errorMessage.hidden = true;

        var authenticated;
        try {
            authenticated = sessions.login(
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

        sessions.redirectToHome();
    });
}
