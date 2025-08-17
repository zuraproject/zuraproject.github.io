// scripts/index.js
import { saveMedia, getAllMedia, registerSW } from './app.js';

registerSW();

const filePicker = document.getElementById('filePicker');
const uploadBtn = document.getElementById('uploadBtn');
const dropzone = document.getElementById('dropzone');
const addStatus = document.getElementById('addStatus');
const recentList = document.getElementById('recentList');
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

uploadBtn?.addEventListener('click', () => filePicker.click());
filePicker?.addEventListener('change', (e) => handleFiles(e.target.files));

dropzone?.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('hover'); });
dropzone?.addEventListener('dragleave', () => dropzone.classList.remove('hover'));
dropzone?.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('hover');
  handleFiles(e.dataTransfer.files);
});

async function handleFiles(files) {
  let added = 0;
  for (const file of files) {
    try { await saveMedia(file); added++; } catch {}
  }
  if (addStatus) addStatus.textContent = `${added} file(s) added to library`;
  await loadRecent();
}

async function loadRecent() {
  const media = await getAllMedia();
  recentList.innerHTML = '';
  if (!media.length) return;
  media.slice(-5).reverse().forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `player.html?id=${item.id}`;
    a.textContent = `${item.name}`;
    li.appendChild(a);
    recentList.appendChild(li);
  });
}

loadRecent();
