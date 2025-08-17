import { saveMedia, getAllMedia, deleteMedia, arrayBufferToObjectURL, registerSW } from './db.js';

document.addEventListener('DOMContentLoaded', () => {

  registerSW();

  const views = {
    home: document.getElementById('view-home'),
    library: document.getElementById('view-library'),
    player: document.getElementById('view-player')
  };
  const navLinks = document.querySelectorAll('nav a');
  const uploadBtn = document.getElementById('uploadBtn');
  const filePicker = document.getElementById('filePicker');
  const recentList = document.getElementById('recentList');
  const libraryList = document.getElementById('libraryList');
  const emptyMsg = document.getElementById('emptyMsg');
  const video = document.getElementById('videoPlayer');
  const audio = document.getElementById('audioPlayer');
  const seekSlider = document.getElementById('seekSlider');
  const volumeSlider = document.getElementById('volumeSlider');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const titleEl = document.getElementById('nowPlayingTitle');

  let activeEl = null;
  let library = [];

  // Navigation
  navLinks.forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      showView(a.dataset.view);
    });
  });

  function showView(name){
    Object.values(views).forEach(v=>v.style.display='none');
    if(views[name]) views[name].style.display='block';
    navLinks.forEach(a=>a.classList.toggle('active',a.dataset.view===name));
  }

  // File Upload
  uploadBtn.addEventListener('click', () => filePicker.click());
  filePicker.addEventListener('change', async () => handleFiles(filePicker.files));
  document.getElementById('dropzone').addEventListener('dragover', e => { e.preventDefault(); });
  document.getElementById('dropzone').addEventListener('drop', async e => {
    e.preventDefault();
    await handleFiles(e.dataTransfer.files);
  });

  async function handleFiles(files) {
    for (const file of files) await saveMedia(file);
    await loadRecent();
    await renderLibrary();
  }

  async function loadRecent() {
    const media = await getAllMedia();
    recentList.innerHTML = '';
    media.slice(-5).reverse().forEach(item => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = item.name;
      a.addEventListener('click', () => loadPlayer(item));
      li.appendChild(a);
      recentList.appendChild(li);
    });
  }

  async function renderLibrary() {
    const media = await getAllMedia();
    library = media.map(i => ({ ...i, url: arrayBufferToObjectURL(i.data,i.type) }));
    libraryList.innerHTML = '';
    if (!library.length) { emptyMsg.style.display='block'; return; }
    emptyMsg.style.display='none';
    library.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.name;
      li.onclick = () => loadPlayer(item);
      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.className = 'btn small danger';
      delBtn.onclick = async e => { e.stopPropagation(); await deleteMedia(item.id); renderLibrary(); loadRecent(); };
      li.appendChild(delBtn);
      libraryList.appendChild(li);
    });
  }

  function loadPlayer(item) {
    activeEl = item.type.startsWith('video/') ? video : audio;
    activeEl.src = arrayBufferToObjectURL(item.data,item.type);
    activeEl.style.display='block';
    (activeEl===video?audio:video).style.display='none';
    titleEl.textContent=`Now Playing: ${item.name}`;
    showView('player');
    activeEl.play();
    if (activeEl === video && document.pictureInPictureEnabled) {
      activeEl.requestPictureInPicture().catch(()=>{});
    }
  }

  // Player controls
  playPauseBtn.addEventListener('click', () => {
    if (!activeEl) return;
    activeEl.paused ? activeEl.play() : activeEl.pause();
  });

  volumeSlider.addEventListener('input', () => { if(activeEl) activeEl.volume = volumeSlider.value; });
  seekSlider.addEventListener('input', () => {
    if(activeEl && activeEl.duration) activeEl.currentTime = (seekSlider.value/100)*activeEl.duration;
  });
  setInterval(() => {
    if(activeEl && activeEl.duration) seekSlider.value = (activeEl.currentTime/activeEl.duration)*100;
  },200);

  // iOS A2HS
  const a2hs = document.getElementById('a2hsBanner');
  const dismiss = document.getElementById('dismissA2HS');
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone) {
    a2hs.style.display='block';
  }
  dismiss.addEventListener('click', () => { a2hs.style.display='none'; });

  showView('home');
  loadRecent();
  renderLibrary();
  document.getElementById('year').textContent = new Date().getFullYear();

});
