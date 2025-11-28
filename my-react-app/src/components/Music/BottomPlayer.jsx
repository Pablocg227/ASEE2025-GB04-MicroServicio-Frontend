import React, { useEffect, useRef, useState } from "react";
import { fileURL } from "../../utils/helpers";
import "../../styles/BottomPlayer.css";

const BottomPlayer = ({ song, onEnded, trigger }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // NUEVO: Estado para saber si el usuario está moviendo la barra
  const [isDragging, setIsDragging] = useState(false);

  // Efecto: Cargar canción y reiniciar si cambia song o trigger
  useEffect(() => {
    if (song && audioRef.current) {
      audioRef.current.src = fileURL(song.archivoMp3);
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Error al reproducir:", err));
    }
  }, [song, trigger]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  // Actualización automática del tiempo (audio -> barra)
  const handleTimeUpdate = () => {
    if (audioRef.current && !isDragging) {
      // SOLO actualizamos si el usuario NO está arrastrando
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // 1. El usuario empieza a tocar la barra
  const handleSeekStart = () => {
    setIsDragging(true);
  };

  // 2. El usuario mueve la barra (solo visual)
  const handleSeekChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
  };

  // 3. El usuario suelta la barra (aplicamos el cambio al audio)
  const handleSeekEnd = (e) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setIsDragging(false);
    // Aseguramos que siga reproduciendo si estaba en play
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  if (!song) return null;

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;
  const cover = song.imgPortada || song.portada || song.imgSencillo || null;
  const coverSrc = cover ? fileURL(cover) : "/placeholder-song.png";

  return (
    <div className="bottom-player-container">
      <div className="player-track-info">
        <img src={coverSrc} alt="Portada" className="player-cover" />
        <div className="player-text">
          <span className="player-title">{song.nomCancion || song.titulo}</span>
          <span className="player-artist">Reproduciendo ahora</span>
        </div>
      </div>

      <div className="player-center-column">
        <div className="player-controls">
          <button onClick={togglePlay} className="btn-player-control main-play">
            {isPlaying ? "⏸" : "▶"}
          </button>
        </div>

        <div className="player-progress-bar-wrapper">
          <span className="time-text">{formatTime(currentTime)}</span>

          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={currentTime}
            // Eventos modificados para evitar el conflicto
            onPointerDown={handleSeekStart} // Al pulsar (ratón o dedo)
            onChange={handleSeekChange} // Al mover
            onPointerUp={handleSeekEnd} // Al soltar
            className="youtube-progress-bar"
            style={{
              "--seek-before-width": `${progressPercent}%`,
            }}
          />

          <span className="time-text">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-volume">
        <span>{volume === 0 ? "🔇" : "🔊"}</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
    </div>
  );
};

export default BottomPlayer;
