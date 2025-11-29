const API = {
    
    usersBase: "http://127.0.0.1:8000",
    flightsBase: "http://127.0.0.1:8001",
    reservasBase: "http://localhost/vuelos_reservas_ms/public", 

    
    getToken() {
        return localStorage.getItem("jwt_token");
    },

    
    setToken(token) {
        localStorage.setItem("jwt_token", token);
    },

    clearToken() {
        localStorage.removeItem("jwt_token");
    },

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

            
            if (response.status === 401) {
                this.clearToken();
                
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

    