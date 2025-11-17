import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para añadir el token JWT
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Decodificar el token JWT para obtener el email del artista
export const getArtistEmailFromToken = () => {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || payload.email; // Ajusta según tu JWT
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};

// Obtener álbumes del artista
export const fetchArtistAlbums = async (artistEmail) => {
    try {
        const response = await api.get(`/artistas/${artistEmail}/albumes`);
        return response.data;
    } catch (error) {
        console.error('Error fetching albums:', error);
        throw error;
    }
};

// Obtener canciones del artista
export const fetchArtistSongs = async (artistEmail) => {
    try {
        const response = await api.get(`/artistas/${artistEmail}/canciones`);
        return response.data;
    } catch (error) {
        console.error('Error fetching songs:', error);
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
    date: (data.date || '').slice(0,10),
    precio: Number(data.precio ?? 0)
  };
  if (Array.isArray(data.canciones_ids)) {
    payload.canciones_ids = data.canciones_ids; // Solo si quieres modificar lista
  }
  return api.put(`/albumes/${albumId}`, payload).then(r => r.data);
};

export const updateSong = (songId, data) => {
  const payload = {
    nomCancion: data.nomCancion || data.titulo,
    imgPortada: data.imgPortada || null,
    genres: Array.isArray(data.genres) ? data.genres : [],
    date: toISODate(data.date),
    precio: Number(data.precio ?? 0),
    idAlbum: data.idAlbum ?? null
    // NUNCA enviar: artistas_emails, numLikes, numIngresos, numVisualizaciones, etc.
  };
  // console.log('PUT /canciones payload', payload);
  return api.put(`/canciones/${songId}`, payload).then(r => r.data);
};

// Eliminar álbum
export const deleteAlbum = async (albumId) => {
    try {
        const response = await api.delete(`/albumes/${albumId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting album:', error);
        throw error;
    }
};

// Eliminar canción
export const deleteSong = async (songId) => {
    try {
        const response = await api.delete(`/canciones/${songId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting song:', error);
        throw error;
    }
};