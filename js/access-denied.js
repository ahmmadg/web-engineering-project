import { logout } from './sessions.js';

var switchAccountLink = document.getElementById('switch-account');
switchAccountLink.addEventListener('click', function (event) {
    event.preventDefault();
    logout();
    globalThis.location.href = new URL('../pages/auth/login.html', import.meta.url).href;
});
