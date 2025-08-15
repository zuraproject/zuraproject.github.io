import { openDB, saveMedia, getAllMedia, getMediaById, deleteMedia, clearLibrary, arrayBufferToObjectURL, registerSW } from './db.js';

const dropzone = document.getElementById('dropzone');
const pickBtn = document.getElementById('pickBtn');
const filePicker = document.getElementById('filePicker');
const mediaList = document.getElementById('mediaList');
const video = document.getElementById('videoPlayer');
const audio = document.getElementById('audioPlayer');
const audioBarsContainer = document.getElementById('audioBarsContainer');
const audioBars = document.getElementById('audioBars');
const clearLibraryBtn = document.getElementById('clearLibraryBtn');

registerSW();

let library = [];

async function loadLibrary() {
  const media = await getAllMedia();
  library = media.map(m => ({ ...m, url: arrayBufferToObjectURL(m.data, m.type) }));
  renderLibrary();
}

function renderLibrary() {
  mediaList.innerHTML = '';
  library.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `<div style="font-size:2rem">${item.type.startsWith('audio')?'🎵':'🎬'}</div>
                    <span>${item.name}</span>`;
    li.onclick = () => playMedia(item);
    const delBtn = document.createElement('button');
    delBtn.textContent = '✖';
    delBtn.className = 'btn small danger';
    delBtn.onclick = async (e) => {
      e.stopPropagation();
      await deleteMedia(item.id);
      await loadLibrary();
    };
    li.appendChild(delBtn);
    mediaList.appendChild(li);
  });
}

function playMedia(item) {
  if (item.type.startsWith('audio')) {
    audio.src = item.url;
    audio.style.display = 'block';
    video.style.display = 'none';
    showAudioBars(true);
    audio.play();
  } else {
    video.src = item.url;
    video.style.display = 'block';
    audio.style.display = 'none';
    showAudioBars(false);
    video.play();
  }
}

function showAudioBars(show) {
  audioBarsContainer.style.display = show ? 'flex' : 'none';
}

// Populate audio bars for animation
audioBars.innerHTML = '';
for (let i = 0; i < 10; i++) {
  const bar = document.createElement('div');
  bar.style.setProperty('--i', i);
  audioBars.appendChild(bar);
}

// File handling
async function handleFiles(files) {
  for (const file of files) {
    await saveMedia(file);
  }
  await loadLibrary();
}

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('hover'); });
dropzone.addEventListener('dragleave', e => { dropzone.classList.remove('hover'); });
dropzone.addEventListener('drop', async e => {
  e.preventDefault(); dropzone.classList.remove('hover');
  await handleFiles(e.dataTransfer.files);
});

pickBtn.addEventListener('click', () => filePicker.click());
filePicker.addEventListener('change', async () => await handleFiles(filePicker.files));

clearLibraryBtn.addEventListener('click', async () => {
  await clearLibrary();
  await loadLibrary();
});

document.getElementById('year').textContent = new Date().getFullYear();
loadLibrary();
