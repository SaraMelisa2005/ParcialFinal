const user = getUser();

// Validar sesión activa
if (!user) {
    window.location.href = "login.html";
    } else {
    document.getElementById("username").textContent = user.name || user.email;
}

// Logout
document.getElementById("btnLogout").addEventListener("click", () => {
    clearStorage();
    window.location.href = "login.html";
});