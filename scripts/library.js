import { getAllMedia } from './app.js';

const libraryList = document.getElementById('libraryList');
const emptyMsg = document.getElementById('emptyMsg');
const searchInput = document.getElementById('searchInput');
const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

async function renderLibrary(filter = '') {
  const media = await getAllMedia();
  libraryList.innerHTML = '';
  const filtered = media.filter(item => item.name.toLowerCase().includes(filter.toLowerCase()));
  if (!filtered.length) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';
  filtered.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.name;
    li.onclick = () => {
      localStorage.setItem('currentMedia', JSON.stringify(item));
      window.location.href = 'player.html';
    };
    libraryList.appendChild(li);
  });
}

searchInput.oninput = () => renderLibrary(searchInput.value);
renderLibrary();
