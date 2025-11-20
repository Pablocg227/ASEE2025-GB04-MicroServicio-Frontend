import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useUser from '../hooks/useUser';
import { 
  fetchUserPurchases, 
  fetchSongById, 
  fetchUserAlbumPurchases, 
  fetchAlbumById 
} from '../services/api';
import '../styles/ProfilePage.css';

const API_BASE_URL = 'http://127.0.0.1:8001';
const FILES_BASE_URL = 'http://127.0.0.1:8080';

export default function ProfilePage() {
  const { email } = useParams();
  const navigate = useNavigate();
  const { user, loading, error } = useUser(email);
  
  const [showEditModal, setShowEditModal] = useState(false);
  const [purchasedSongs, setPurchasedSongs] = useState([]);
  const [purchasedAlbums, setPurchasedAlbums] = useState([]);
  const [activeTab, setActiveTab] = useState('songs');
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  
  const [editForm, setEditForm] = useState({
    display_name: '',
    password: '',
    avatar: null
  });
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const avatarInputRef = useRef(null);

  // 1. Verificar propiedad
  useEffect(() => {
    const checkOwnership = async () => {
      const token = localStorage.getItem('authToken');
      if (!token || !email) {
        setIsOwner(false);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          const currentUserEmail = data.user_data?.email || data.email;
          setIsOwner(currentUserEmail === email);
        } else {
          setIsOwner(false);
        }
      } catch (err) {
        console.error(err);
        setIsOwner(false);
      }
    };
    checkOwnership();
  }, [email]);

  // 2. Cargar Compras
  useEffect(() => {
    if (email) {
      setPurchasesLoading(true);
      const loadAllPurchases = async () => {
        try {
          // Cargar Canciones
          const songPurchaseIds = await fetchUserPurchases(email);
          const songsPromises = songPurchaseIds.map(p => fetchSongById(p.idCancion || p));
          const songs = await Promise.all(songsPromises);
          setPurchasedSongs(songs);

          // Cargar Álbumes
          const albumPurchasesData = await fetchUserAlbumPurchases(email);
          const albumsPromises = albumPurchasesData.map(p => fetchAlbumById(p.idAlbum || p));
          const albums = await Promise.all(albumsPromises);
          setPurchasedAlbums(albums);

        } catch (err) {
          console.error(err);
        } finally {
          setPurchasesLoading(false);
        }
      };
      loadAllPurchases();
    }
  }, [email]);

  // Handlers del Modal
  const handleOpenEdit = () => {
    setEditForm({
      display_name: user.display_name || '',
      password: '',
      avatar: null
    });
    setPreviewAvatar(null);
    setShowEditModal(true);
  };
  const handleCloseEdit = () => setShowEditModal(false);

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
      if (!response.ok) throw new Error('Error update');
      alert('Perfil actualizado');
      handleCloseEdit();
      window.location.reload();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">{error.message}</div>;
  if (!user) return <div className="error">Usuario no encontrado</div>;

  const username = user.display_name || 'Usuario';
  const backendAvatarUrl = user.avatar_url ? `${API_BASE_URL}${user.avatar_url}` : null;

  return (
    <div className="profile-page">
      
      {/* HEADER */}
      <div className="profile-header-container">

        {/* 0. BOTÓN VOLVER (Ahora vive aquí dentro) */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          <span>←</span> Volver
        </button>
        <div className="profile-banner"></div>
        <div className="profile-header-content">
          <div className="avatar-box">
            {backendAvatarUrl ? (
              <img src={backendAvatarUrl} alt="avatar" />
            ) : (
              <div className="avatar-placeholder">{username.charAt(0).toUpperCase()}</div>
            )}
          </div>

          <div className="profile-info">
            <h1>{username}</h1>
            <div className="profile-actions">
              {isOwner && (
                <button className="btn-edit" onClick={handleOpenEdit}>Editar Perfil</button>
              )}
              <button className="btn-share">Compartir</button>
            </div>
          </div>
        </div>

        <div className="profile-tabs-container">
          <div className="profile-tabs">
            <button 
              className={`tab-btn ${activeTab === 'songs' ? 'active' : ''}`}
              onClick={() => setActiveTab('songs')}
            >
              Canciones ({purchasedSongs.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'albums' ? 'active' : ''}`}
              onClick={() => setActiveTab('albums')}
            >
              Álbumes ({purchasedAlbums.length})
            </button>
          </div>
        </div>
      </div>

      {/* GRID CONTENIDO */}
      <main className="purchases-grid">
        {purchasesLoading ? (
          <div className="loading">Cargando colección...</div>
        ) : (
          <>
            {/* VISTA CANCIONES */}
            {activeTab === 'songs' && (
              purchasedSongs.length > 0 ? (
                purchasedSongs.map(song => (
                  <div key={song.id} className="purchase-card">
                    <div className="card-image">
                      <img 
                        src={`${FILES_BASE_URL}${song.imgPortada || song.portada}?t=${Date.now()}`}
                        alt={song.nomCancion}
                        onError={(e) => e.target.src = 'https://via.placeholder.com/200'}
                      />
                    </div>
                    <div className="card-details">
                      <h3>{song.nomCancion}</h3>
                      {/* Aquí también corregimos por si acaso: artistas_emails */}
                      <p>{song.artistas_emails?.[0] || 'Artista desconocido'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-msg">No tienes canciones compradas.</div>
              )
            )}

            {/* VISTA ÁLBUMES */}
            {activeTab === 'albums' && (
              purchasedAlbums.length > 0 ? (
                purchasedAlbums.map(album => (
                  <div key={album.id} className="purchase-card">
                    <div className="card-image">
                      <img 
                        src={`${FILES_BASE_URL}${album.imgPortada || album.portada}?t=${Date.now()}`}
                        alt={album.titulo}
                        onError={(e) => e.target.src = 'https://via.placeholder.com/200'}
                      />
                    </div>
                    <div className="card-details">
                      <h3>{album.titulo}</h3>
                      {/* AQUÍ ESTABA EL ERROR: era "artista_emails" y ahora es "artistas_emails" */}
                      <p>{album.artistas_emails?.[0] || 'Varios Artistas'}</p>
                      <span className="badge-album">Álbum</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-msg">No tienes álbumes comprados.</div>
              )
            )}
          </>
        )}
      </main>

      {/* MODAL EDITAR */}
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
                    <img src={previewAvatar || backendAvatarUrl} alt="preview" className="avatar-preview"/>
                  )}
                  <button type="button" className="btn btn-outline" onClick={() => avatarInputRef.current?.click()}>Cambiar imagen</button>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                </div>
              </div>
              <div className="form-group">
                <label>Nombre de usuario</label>
                <input type="text" name="display_name" value={editForm.display_name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Nueva contraseña (opcional)</label>
                <input type="password" name="password" value={editForm.password} onChange={handleInputChange} placeholder="Dejar en blanco para mantener la actual" />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={handleCloseEdit}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}