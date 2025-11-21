import axios from "axios";

const CONTENTS_BASE_URL = "http://127.0.0.1:8080/api";
const USERS_BASE_URL = "http://127.0.0.1:8001"; // msUsuarios

const api = axios.create({
  baseURL: CONTENTS_BASE_URL,
  headers: {
    "Content-Type": "application/json", // solo para peticiones JSON
  },
});

// Interceptor para añadir el token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Decodificar el token JWT para obtener el email del artista
export const getArtistEmailFromToken = () => {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.email; // Ajusta según tu JWT
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Email de sesión (sirve para oyente o artista) leyendo userData o el JWT
export const getStoredUserEmail = () => {
  try {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed?.email) return parsed.email;
      if (parsed?.user_data?.email) return parsed.user_data.email;
    }
  } catch (err) {
    console.warn("No se pudo parsear userData de localStorage", err);
  }

  const fromToken = getArtistEmailFromToken();
  if (fromToken) return fromToken;

  return null;
};

// Obtener álbumes del artista
export const fetchArtistAlbums = async (artistEmail) => {
  try {
    const response = await api.get(`/artistas/${artistEmail}/albumes`);
    return response.data;
  } catch (error) {
    console.error("Error fetching albums:", error);
    throw error;
  }
};

// Obtener canciones del artista
export const fetchArtistSongs = async (artistEmail) => {
  try {
    const response = await api.get(`/artistas/${artistEmail}/canciones`);
    return response.data;
  } catch (error) {
    console.error("Error fetching songs:", error);
    throw error;
  }
};

// Normaliza fecha
const toISODate = (d) => (d ? String(d).slice(0, 10) : null);

/* ----------------------------------------------------------
   🟦 updateAlbum → enviar FormData con portada opcional
---------------------------------------------------------- */
export const updateAlbum = async (albumId, data, coverFile) => {
  const form = new FormData();

  if (data.titulo !== undefined) form.append("titulo", data.titulo);
  if (data.precio !== undefined) form.append("precio", data.precio);
  if (data.date) form.append("date", toISODate(data.date));

  if (Array.isArray(data.genre)) {
    data.genre.forEach((g) => form.append("genre", g));
  }

  if (Array.isArray(data.canciones_ids)) {
    data.canciones_ids.forEach((id) => form.append("canciones_ids", id));
  }

  if (Array.isArray(data.artista_emails)) {
    data.artista_emails.forEach((email) =>
      form.append("artista_emails", email),
    );
  }

  if (coverFile) {
    form.append("portada", coverFile);
  }

  const response = await api.put(`/albumes/${albumId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

/* ----------------------------------------------------------
   🟩 updateSong → enviar FormData con portada opcional
---------------------------------------------------------- */
export const updateSong = async (songId, data, coverFile) => {
  const form = new FormData();

  form.append("nomCancion", data.nomCancion || data.titulo);
  if (data.precio !== undefined) form.append("precio", data.precio);
  if (data.date) form.append("date", toISODate(data.date));

  if (data.idAlbum !== undefined && data.idAlbum !== null) {
    form.append("idAlbum", data.idAlbum);
  }

  if (Array.isArray(data.genres)) {
    data.genres.forEach((g) => form.append("generos", g));
  }

  if (Array.isArray(data.artista_emails)) {
    data.artista_emails.forEach((email) =>
      form.append("artista_emails", email),
    );
  }

  if (coverFile) {
    form.append("portada", coverFile);
  }

  const response = await api.put(`/canciones/${songId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data;
};

// Eliminar álbum
export const deleteAlbum = async (albumId) => {
  try {
    const response = await api.delete(`/albumes/${albumId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting album:", error);
    throw error;
  }
};

// Eliminar canción
export const deleteSong = async (songId) => {
  try {
    const response = await api.delete(`/canciones/${songId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting song:", error);
    throw error;
  }
};

// =====================================
// endpoints PÚBLICOS oyente RF-4.3
// =====================================

// Obtener todas las canciones públicas
export const fetchPublicSongs = async () => {
  const response = await api.get("/canciones");
  return response.data;
};

// Obtener detalles de una canción pública por ID
export const fetchSongById = async (songId) => {
  const response = await api.get(`/canciones/${songId}`);
  return response.data;
};

// Obtener todos los álbumes públicos
export const fetchPublicAlbums = async () => {
  const response = await api.get("/albumes");
  return response.data;
};

// Obtener detalles de un álbum público por ID
export const fetchAlbumById = async (albumId) => {
  const response = await api.get(`/albumes/${albumId}`);
  return response.data;
};

// Obtener canciones de un álbum concreto (vista oyente)
export const fetchAlbumTracks = async (albumId) => {
  const response = await api.get(`/albumes/${albumId}/canciones`);
  return response.data;
};

// Registrar reproducción de una canción (incrementa numVisualizaciones)
export const registerSongPlay = async (songId) => {
  const response = await api.post(`/canciones/${songId}/play`);
  return response.data;
};

// Comprar una canción (requiere token de msUsuarios)
export const purchaseSong = async ({ songId, pricePaid, userEmail }) => {
  const user_ref = userEmail || getStoredUserEmail();
  if (!user_ref) {
    const err = new Error("No se pudo determinar el email del usuario.");
    err.code = "missing_user_email";
    throw err;
  }

  const response = await api.post("/compras", {
    song_id: songId,
    user_ref,
    price_paid: pricePaid,
  });
  return response.data;
};

// Comprar un álbum completo (pay-what-you-want con mínimo = precio del álbum)
export const purchaseAlbum = async ({ albumId, pricePaid, userEmail }) => {
  const user_ref = userEmail || getStoredUserEmail();
  if (!user_ref) {
    const err = new Error("No se pudo determinar el email del usuario.");
    err.code = "missing_user_email";
    throw err;
  }

  const response = await api.post(`/albumes/${albumId}/compras`, {
    user_ref,
    price_paid: pricePaid,
  });
  return response.data;
};

// ========================
// Microservicio de usuarios
// ========================

const usersApi = axios.create({
  baseURL: USERS_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Un artista por email
export const fetchArtistByEmail = async (email) => {
  if (!email) return null;
  try {
    const response = await usersApi.get(
      `/artistas/${encodeURIComponent(email)}`,
    );
    return response.data; // { email, display_name, ... }
  } catch (error) {
    console.error("Error fetching artist by email:", email, error);
    return null;
  }
};

// Varios artistas -> diccionario { email: artista }
export const fetchArtistsByEmails = async (emails) => {
  if (!Array.isArray(emails) || emails.length === 0) return {};

  const uniqueEmails = Array.from(
    new Set(
      emails.filter(
        (email) => typeof email === "string" && email.trim().length > 0,
      ),
    ),
  );

  const result = {};

  await Promise.all(
    uniqueEmails.map(async (email) => {
      const artist = await fetchArtistByEmail(email);
      if (artist) {
        result[email] = artist;
      }
    }),
  );

  return result;
};
