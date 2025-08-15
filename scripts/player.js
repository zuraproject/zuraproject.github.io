const video = document.getElementById('videoPlayer');
const audio = document.getElementById('audioPlayer');
const seekSlider = document.getElementById('seekSlider');
const volumeSlider = document.getElementById('volumeSlider');
const playPauseBtn = document.getElementById('playPauseBtn');
const titleEl = document.getElementById('nowPlayingTitle');
const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

const media = JSON.parse(localStorage.getItem('currentMedia'));
if (!media) {
  titleEl.textContent = 'No media selected';
} else {
  const blob = new Blob([media.data], { type: media.type });
  const url = URL.createObjectURL(blob);
  if (media.type.startsWith('video')) {
    video.src = url;
    video.style.display = 'block';
  } else {
    audio.src = url;
    audio.style.display = 'block';
  }
  titleEl.textContent = `Now Playing: ${media.name}`;
}

function getActivePlayer() {
  return media.type.startsWith('video') ? video : audio;
}

playPauseBtn.onclick = () => {
  const player = getActivePlayer();
  if (player.paused) player.play();
  else player.pause();
};

volumeSlider.oninput = () => {
  getActivePlayer().volume = volumeSlider.value;
};

seekSlider.oninput = () => {
  const player = getActivePlayer();
  player.currentTime = (seekSlider.value / 100) * player.duration;
};

getActivePlayer().ontimeupdate = () => {
  const player = getActivePlayer();
  if (player.duration) {
    seekSlider.value = (player.currentTime / player.duration) * 100;
  }
};
