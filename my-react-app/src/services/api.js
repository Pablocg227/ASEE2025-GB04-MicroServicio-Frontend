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

// export const updateUser = async (email, data) => { ... }
// export const deleteUser = async (email) => { ... }