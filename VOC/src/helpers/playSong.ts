export const playSong = (path: string) => {
  const audio = new Audio(path);
  audio.volume = 0.5; // Volume entre 0 e 1
  audio.play().catch((e) => {
    console.warn("Falha ao tocar som:", e);
  });
};
