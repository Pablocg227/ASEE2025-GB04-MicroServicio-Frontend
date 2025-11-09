import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import useUser from '../hooks/useUser';
import { fetchUserPurchases, fetchSongById } from '../services/api';
import '../styles/ProfilePage.css';

const API_BASE_URL = 'http://127.0.0.1:8001';
const FILES_BASE_URL = 'http://127.0.0.1:8080';

export default function ProfilePage() {
  const { email } = useParams();
  const { user, loading, error } = useUser(email);
  const [showEditModal, setShowEditModal] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [purchasedSongs, setPurchasedSongs] = useState([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false); // Nuevo estado
  const [editForm, setEditForm] = useState({
    display_name: '',
    password: '',
    avatar: null
  });
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const avatarInputRef = useRef(null);

  // Verificar si el usuario autenticado es el dueño del perfil
  useEffect(() => {
    const checkOwnership = async () => {
      const token = localStorage.getItem('authToken');
      if (!token || !email) {
        setIsOwner(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const currentUserEmail = data.user_data?.email || data.email;
          setIsOwner(currentUserEmail === email);
        } else {
          setIsOwner(false);
        }
      } catch (err) {
        console.error('Error verificando propiedad del perfil:', err);
        setIsOwner(false);
      }
    };

    checkOwnership();
  }, [email]);

  useEffect(() => {
    if (email) {
      fetchUserPurchases(email)
        .then(async (purchaseIds) => {
          setPurchases(purchaseIds);
          
          const songsPromises = purchaseIds.map(id => fetchSongById(id));
          const songs = await Promise.all(songsPromises);
          setPurchasedSongs(songs);
          setPurchasesLoading(false);
        })
        .catch(err => {
          console.error('Error al cargar compras:', err);
          setPurchasesLoading(false);
        });
    }
  }, [email]);

  if (loading) return <div className="profile-page loading">Cargando perfil...</div>;
  if (error) return <div className="profile-page error">Error: {error.message}</div>;
  if (!user) return <div className="profile-page error">Usuario no encontrado</div>;

  const username = user.display_name || 'Usuario';
  const collectionsCount = purchases.length || 0;
  const backendAvatarUrl = user.avatar_url ? `${API_BASE_URL}${user.avatar_url}` : null;

  const handleOpenEdit = () => {
    setEditForm({
      display_name: user.display_name || '',
      password: '',
      avatar: null
    });
    setPreviewAvatar(null);
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setPreviewAvatar(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditForm(prev => ({ ...prev, avatar: file }));
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('display_name', editForm.display_name);
    if (editForm.password) formData.append('password', editForm.password);
    if (editForm.avatar) formData.append('avatar', editForm.avatar);

    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${encodeURIComponent(email)}`, {
        method: 'PUT',
        body: formData
      });

      if (!response.ok) throw new Error('Error al actualizar perfil');

      alert('Perfil actualizado correctamente');
      handleCloseEdit();
      window.location.reload(); // Recargar para mostrar cambios
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="profile-page">
      <section className="profile-header">
        <div className="avatar-box">
          {backendAvatarUrl ? (
            <img src={backendAvatarUrl} alt="avatar" />
          ) : (
            <div className="avatar-placeholder">
              <span className="cam">?</span>
            </div>
          )}
        </div>

        <div className="profile-meta">
          <div className="title-row">
            <h1>{username}</h1>
            <div className="actions">
              {isOwner && (
                <button className="btn btn-outline" onClick={handleOpenEdit}>
                  EDITAR PERFIL
                </button>
              )}
              <button className="link">compartir perfil</button>
            </div>
          </div>

          <nav className="tabs">
            <button className="tab active">{collectionsCount} compras</button>
          </nav>
        </div>
      </section>

      <main className="profile-content">
        {purchasesLoading ? (
          <div>Cargando compras...</div>
        ) : collectionsCount === 0 ? (
          <div className="empty-state">
            <p>Este usuario no tiene compras... </p>
          </div>
        ) : (
          <div className="purchases-grid">
            {purchasedSongs.map(song => (
              <div key={song.id} className="purchase-item">
                <img 
                  src={`${FILES_BASE_URL}${song.imgPortada}?t=${Date.now()}`}
                  alt={song.nomCancion}
                  className="song-cover"
                  onError={(e) => {
                    console.error('Error cargando imagen:', `${FILES_BASE_URL}${song.imgPortada}`);
                    e.target.src = '/placeholder-song.png';
                  }}
                />
                <h3>{song.nomCancion}</h3>
                <p>{song.artistas_emails?.[0] || 'Artista desconocido'}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de edición */}
      {showEditModal && (
        <div className="modal-overlay" onClick={handleCloseEdit}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Perfil</h2>
              <button className="close-btn" onClick={handleCloseEdit}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="edit-form">
              <div className="form-group">
                <label>Imagen de perfil</label>
                <div className="avatar-upload">
                  {(previewAvatar || backendAvatarUrl) && (
                    <img 
                      src={previewAvatar || backendAvatarUrl} 
                      alt="preview" 
                      className="avatar-preview"
                    />
                  )}
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    Cambiar imagen
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    hidden
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="display_name">Nombre de usuario</label>
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  value={editForm.display_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Nueva contraseña (opcional)</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={editForm.password}
                  onChange={handleInputChange}
                  placeholder="Dejar en blanco para mantener la actual"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={handleCloseEdit}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}