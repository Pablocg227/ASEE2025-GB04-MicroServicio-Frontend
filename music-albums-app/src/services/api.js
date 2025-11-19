import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
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

export const getArtistEmailFromToken = () => {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.sub || payload.email;
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

// Obtener álbumes del artista
export const fetchArtistAlbums = async (artistEmail) => {
  const response = await api.get(`/artistas/${artistEmail}/albumes`);
  return response.data;
};

// Obtener canciones del artista
export const fetchArtistSongs = async (artistEmail) => {
  const response = await api.get(`/artistas/${artistEmail}/canciones`);
  return response.data;
};

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
  const response = await api.delete(`/albumes/${albumId}`);
  return response.data;
};

// Eliminar canción
export const deleteSong = async (songId) => {
  const response = await api.delete(`/canciones/${songId}`);
  return response.data;
};
