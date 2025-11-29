import { getToken } from './js/local-storage.js';
import { getUser, logout } from './js/local-storage.js';

if (!getToken()) 
    window.location.href = 'login.html';

const user = getUser();


if (!user) {
    window.location.href = "login.html";
    } else {
    document.getElementById("username").textContent = user.name || user.email;
}

const btnLogout = document.getElementById("btnLogout");
console.log("btnLogout element:", btnLogout);


document.getElementById("btnLogout").addEventListener("click", logout);