import axios from "axios";

const CONTENTS_BASE_URL = "http://127.0.0.1:8080/api";
const USERS_BASE_URL = "http://127.0.0.1:8001"; // msUsuarios

const api = axios.create({
  baseURL: CONTENTS_BASE_URL,
  headers: {
    "Content-Type": "application/json",
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

// Normaliza arrays/fecha y ENVÍA SOLO CAMPOS EDITABLES
const toISODate = (d) => (d ? String(d).slice(0, 10) : null);

export const updateAlbum = (albumId, data) => {
  const payload = {
    titulo: data.titulo,
    imgPortada: data.imgPortada || null,
    genre: Array.isArray(data.genre) ? data.genre : [],
    date: (data.date || "").slice(0, 10),
    precio: Number(data.precio ?? 0),
  };
  if (Array.isArray(data.canciones_ids)) {
    payload.canciones_ids = data.canciones_ids; // Solo si quieres modificar lista
  }
  return api.put(`/albumes/${albumId}`, payload).then((r) => r.data);
};

export const updateSong = (songId, data) => {
  const payload = {
    nomCancion: data.nomCancion || data.titulo,
    imgPortada: data.imgPortada || null,
    genres: Array.isArray(data.genres) ? data.genres : [],
    date: toISODate(data.date),
    precio: Number(data.precio ?? 0),
    idAlbum: data.idAlbum ?? null,
    // NUNCA enviar: artistas_emails, numLikes, numIngresos, numVisualizaciones, etc.
  };
  // console.log('PUT /canciones payload', payload);
  return api.put(`/canciones/${songId}`, payload).then((r) => r.data);
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

// =====================================
// Microservicio usuarios – datos de artistas
// =====================================

// Registrar reproducción de una canción (incrementa numVisualizaciones)
export const registerSongPlay = async (songId) => {
  const response = await api.post(`/canciones/${songId}/play`);
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
