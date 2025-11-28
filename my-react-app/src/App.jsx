import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { registerSongPlay, getStoredUserEmail } from "./services/musicApi";
import { postSongReproduction } from "./services/api";

import ProfilePage from "./components/ProfilePage";
import MusicPage from "./components/Music/MusicPage";
import PublicSongDetail from "./components/Music/PublicSongDetail";
import PublicAlbumDetail from "./components/Music/PublicAlbumDetail";
import PlaylistDetailPage from "./components/Music/PlaylistDetailPage";
import BottomPlayer from "./components/Music/BottomPlayer";

import "./styles/App.css";

export default function App() {
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  // NUEVO: Historial de canciones reproducidas
  const [history, setHistory] = useState([]);

  const [playTrigger, setPlayTrigger] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  const handleGlobalPlay = async (song, contextQueue = null) => {
    if (!song || !song.id) return;

    // Si ya hay una canción sonando, la guardamos en el historial antes de cambiar
    if (currentSong) {
      setHistory((prev) => [...prev, currentSong]);
    }

    setCurrentSong(song);

    if (
      contextQueue &&
      Array.isArray(contextQueue) &&
      contextQueue.length > 0
    ) {
      setQueue(contextQueue);
    } else if (queue.length === 0) {
      setQueue([song]);
    }

    setPlayTrigger((prev) => prev + 1);

    const email = getStoredUserEmail();
    if (email) {
      postSongReproduction(song.id, email).catch((err) => console.warn(err));
    }

    try {
      await registerSongPlay(song.id);
    } catch (error) {
      console.error("Error al registrar reproducción:", error);
    }
  };

  const handleNext = () => {
    if (!currentSong || queue.length === 0) return;

    if (isRepeat) {
      setPlayTrigger((prev) => prev + 1);
      return;
    }

    // Guardar en historial antes de avanzar
    setHistory((prev) => [...prev, currentSong]);

    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    let nextIndex = -1;

    if (isShuffle && queue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex + 1;
    }

    // Si llegamos al final de la lista normal, no hacemos nada (o podríamos volver al 0)
    // Aquí asumimos que se para si no es shuffle
    if (queue[nextIndex]) {
      // Importante: No llamamos a handleGlobalPlay para evitar doble historial en este flujo específico
      // Pero para simplificar y mantener consistencia, actualizamos manual
      setCurrentSong(queue[nextIndex]);
      setPlayTrigger((prev) => prev + 1);

      // Registrar stats de la siguiente
      const nextSong = queue[nextIndex];
      const email = getStoredUserEmail();
      if (email) postSongReproduction(nextSong.id, email).catch(() => {});
      registerSongPlay(nextSong.id).catch(() => {});
    }
  };

  // NUEVO: Handle Prev usando Historial
  const handlePrev = () => {
    // 1. Si hay historial, volvemos a la anterior
    if (history.length > 0) {
      const prevSong = history[history.length - 1];

      // Quitamos la última del historial (pop)
      setHistory((prev) => prev.slice(0, -1));

      setCurrentSong(prevSong);
      setPlayTrigger((prev) => prev + 1);

      // Registrar stats (opcional al volver atrás, pero consistente)
      const email = getStoredUserEmail();
      if (email) postSongReproduction(prevSong.id, email).catch(() => {});
      registerSongPlay(prevSong.id).catch(() => {});

      return;
    }

    // 2. Si NO hay historial pero hay lista, intentamos ir al index anterior (comportamiento clásico)
    if (currentSong && queue.length > 0) {
      const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
      const prevIndex = currentIndex - 1;
      if (queue[prevIndex]) {
        setCurrentSong(queue[prevIndex]);
        setPlayTrigger((prev) => prev + 1);

        const prevS = queue[prevIndex];
        const email = getStoredUserEmail();
        if (email) postSongReproduction(prevS.id, email).catch(() => {});
        registerSongPlay(prevS.id).catch(() => {});
      } else {
        // Si es la primera y no hay historial, reiniciamos
        setPlayTrigger((prev) => prev + 1);
      }
    }
  };

  return (
    <BrowserRouter>
      <div
        className="app-container"
        style={{ paddingBottom: currentSong ? "90px" : "0" }}
      >
        <Routes>
          <Route
            path="/musica"
            element={<MusicPage onPlay={handleGlobalPlay} />}
          />
          <Route
            path="/musica/cancion/:songId"
            element={<PublicSongDetail onPlay={handleGlobalPlay} />}
          />
          <Route
            path="/musica/album/:albumId"
            element={<PublicAlbumDetail onPlay={handleGlobalPlay} />}
          />
          <Route
            path="/musica/playlist/:playlistId"
            element={<PlaylistDetailPage onPlay={handleGlobalPlay} />}
          />
          <Route path="/perfil/:email" element={<ProfilePage />} />
          <Route path="/" element={<Navigate to="/musica" replace />} />
          <Route path="*" element={<div>Página no encontrada</div>} />
        </Routes>

        {currentSong && (
          <BottomPlayer
            song={currentSong}
            trigger={playTrigger}
            onNext={handleNext}
            onPrev={handlePrev}
            onEnded={handleNext}
            isShuffle={isShuffle}
            toggleShuffle={() => setIsShuffle(!isShuffle)}
            isRepeat={isRepeat}
            toggleRepeat={() => setIsRepeat(!isRepeat)}
          />
        )}
      </div>
    </BrowserRouter>
  );
}
