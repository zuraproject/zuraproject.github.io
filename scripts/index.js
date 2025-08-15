import { saveMedia, getAllMedia } from './app.js';

const filePicker = document.getElementById('filePicker');
const pickBtn = document.getElementById('pickBtn');
const dropzone = document.getElementById('dropzone');
const addStatus = document.getElementById('addStatus');
const recentList = document.getElementById('recentList');
const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

pickBtn.onclick = () => filePicker.click();
filePicker.onchange = (e) => handleFiles(e.target.files);

dropzone.ondragover = (e) => { e.preventDefault(); dropzone.classList.add('hover'); };
dropzone.ondragleave = () => dropzone.classList.remove('hover');
dropzone.ondrop = (e) => {
  e.preventDefault();
  dropzone.classList.remove('hover');
  handleFiles(e.dataTransfer.files);
};

async function handleFiles(files) {
  let added = 0;
  for (const file of files) {
    await saveMedia(file);
    added++;
  }
  addStatus.textContent = `${added} file(s) added to library`;
  loadRecent();
}

async function loadRecent() {
  const media = await getAllMedia();
  recentList.innerHTML = '';
  media.slice(-5).forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    recentList.appendChild(li);
  });
}
loadRecent();
