/**
 * API Helper para consumo de microservicios con JWT
 * Se encarga de inyectar el Authorization: Bearer <token> en cada request
 */

const API = {
    // BASE URLs - AJUSTA LOS PUERTOS SI CAMBIAS
    usersBase: "http://127.0.0.1:8000",
    flightsBase: "http://127.0.0.1:8001",
    reservasBase: "http://localhost/vuelos_reservas_ms/public", // si no existe ignóralo

    /**
     * Lee token desde localStorage
     */
    getToken() {
        return localStorage.getItem("jwt_token");
    },

    /**
     * Guardar token
     */
    setToken(token) {
        localStorage.setItem("jwt_token", token);
    },

    /**
     * Eliminar token (logout)
     */
    clearToken() {
        localStorage.removeItem("jwt_token");
    },

    /**
     * Construcción de headers con Authorization
     */
    buildHeaders(extraHeaders = {}) {
        const token = this.getToken();
        const headers = {
            "Content-Type": "application/json",
            ...extraHeaders
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        return headers;
    },
    /**
     * Método genérico de llamada
     */
    async request(method, url, data = null, base = "") {
        try {
            const options = {
                method,
                headers: this.buildHeaders()
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(base + url, options);

            // Si el token expiró o hay error 401
            if (response.status === 401) {
                this.clearToken();
                // Si estás en login.html no mostrar alerta, porque auth.js ya lo hará
                if (!window.location.href.includes('login.html')) {
                    alert("Sesión expirada o sin autorización. Por favor inicia sesión nuevamente.");
                }
                window.location.href = "login.html";
                return;
            }

            const json = await response.json();

            if (!response.ok) {
                console.error("API Error:", json);
            }

            return json;

        } catch (error) {
            console.error("Error en API:", error);
            alert("Error de conexión con el servidor");
        }
    },

    get(url, base) {
        return this.request("GET", url, null, base);
    },

    post(url, data, base) {
        return this.request("POST", url, data, base);
    },

    put(url, data, base) {
        return this.request("PUT", url, data, base);
    },

    delete(url, base) {
        return this.request("DELETE", url, null, base);
    }
};