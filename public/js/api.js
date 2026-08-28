const TOKEN_KEY = "snap_token";
const USER_KEY = "snap_user";

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Inténtalo de nuevo.");
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    // Respuesta sin cuerpo JSON (p. ej. 204 No Content): la ignoramos.
  }

  if (!response.ok) {
    const error = new Error(data.error ?? "Ha ocurrido un error inesperado.");
    error.status = response.status;
    throw error;
  }

  return data;
}
