document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("form-login");
    const btn = document.getElementById("btn-login");

    form.addEventListener("submit", function (e) {
        const user = document.getElementById("username").value.trim();
        const pass = document.getElementById("password").value.trim();

        if (user === "") {
            alert("Debe ingresar el nombre de usuario");
            e.preventDefault();
            return false;
        }

        if (pass === "") {
            alert("Debe ingresar la contraseña");
            e.preventDefault();
            return false;
        }

        // Evita doble envío
        btn.disabled = true;
        btn.textContent = "Ingresando...";
    });
});