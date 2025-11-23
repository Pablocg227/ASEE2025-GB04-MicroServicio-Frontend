const API_BASE_URL = 'http://127.0.0.1:8001';
const COMPRAS_API_URL = 'http://127.0.0.1:8080/api';

export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export const postData = async (endpoint, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error posting data:', error);
    throw error;
  }
};

export const fetchUserByEmail = async (email) => {
  const response = await fetch(`${API_BASE_URL}/usuarios/${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

export const fetchArtistByEmail = async (email) => {
  const response = await fetch(`${API_BASE_URL}/artistas/${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
};

export const fetchUserPurchases = async (email) => {
  try {
    const response = await fetch(`${COMPRAS_API_URL}/compras?user_ref=${encodeURIComponent(email)}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching purchases:', error);
    throw error;
  }
};

export const fetchSongById = async (songId) => {
  try {
    const response = await fetch(`${COMPRAS_API_URL}/canciones/${songId}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching song:', error);
    throw error;
  }
};

// 1. Obtener lista de compras de álbumes
export const fetchUserAlbumPurchases = async (email) => {
  try {
    // Nota: Asumo que COMPRAS_API_URL es 'http://127.0.0.1:8080/api' basado en tu código anterior
    const response = await fetch(`${COMPRAS_API_URL}/compras/albumes?user_ref=${encodeURIComponent(email)}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching album purchases:', error);
    throw error;
  }
};

// 2. Obtener detalle de un álbum por ID
export const fetchAlbumById = async (albumId) => {
  try {
    const response = await fetch(`${COMPRAS_API_URL}/albumes/${albumId}`);
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching album details:', error);
    throw error;
  }
};