import { saveMedia, getAllMedia, deleteMedia } from './db.js';

const uploadBtn = document.getElementById('uploadBtn');
const fileInput = document.getElementById('fileInput');
const videoPlayer = document.getElementById('videoPlayer');
const audioPlayer = document.getElementById('audioPlayer');
const libraryList = document.getElementById('mediaLibrary');

// Upload handler
uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (event) => {
  const files = event.target.files;
  for (let file of files) {
    await saveMedia(file);
  }
  renderLibrary();
  fileInput.value = '';
});

// Render library
async function renderLibrary() {
  libraryList.innerHTML = '';
  const media = await getAllMedia();
  media.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;

    const playBtn = document.createElement('button');
    playBtn.textContent = 'Play';
    playBtn.onclick = () => playMedia(item);

    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.onclick = async () => {
      await deleteMedia(item.id);
      renderLibrary();
    };

    li.appendChild(playBtn);
    li.appendChild(delBtn);
    libraryList.appendChild(li);
  });
}

// Play media
function playMedia(item) {
  const blob = new Blob([item.data], { type: item.type });
  const url = URL.createObjectURL(blob);

  if (item.type.startsWith('video/')) {
    audioPlayer.style.display = 'none';
    videoPlayer.style.display = 'block';
    videoPlayer.src = url;
    videoPlayer.play();
    if ('requestPictureInPicture' in videoPlayer) {
      videoPlayer.addEventListener('dblclick', () => videoPlayer.requestPictureInPicture());
    }
  } else if (item.type.startsWith('audio/')) {
    videoPlayer.style.display = 'none';
    audioPlayer.style.display = 'block';
    audioPlayer.src = url;
    audioPlayer.play();
  }
}

renderLibrary();
