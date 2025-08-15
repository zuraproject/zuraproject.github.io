import { saveMedia,getAllMedia,getMediaById,deleteMedia,arrayBufferToObjectURL,clearLibrary,registerSW } from './app.js';

registerSW();

const views = { home:document.getElementById('view-home'), library:document.getElementById('view-library'), player:document.getElementById('view-player') };
const navLinks = document.querySelectorAll('nav a');

navLinks.forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const view = a.dataset.view;
    showView(view);
  });
});

function showView(name){
  Object.values(views).forEach(v=>v.style.display='none');
  if(views[name]) views[name].style.display='block';
  navLinks.forEach(a=>a.classList.toggle('active',a.dataset.view===name));
}

// Sidebar / settings
const sidebar=document.getElementById('sidebar');
document.getElementById('settingsBtn').addEventListener('click',()=>{sidebar.style.display='block';});
document.getElementById('closeSettingsBtn').addEventListener('click',()=>{sidebar.style.display='none';});
document.getElementById('clearLibraryBtn').addEventListener('click',async ()=>{
  await clearLibrary();
  loadRecent();
  renderLibrary();
  sidebar.style.display='none';
});

// Home logic
const filePicker=document.getElementById('filePicker');
const pickBtn=document.getElementById('pickBtn');
const dropzone=document.getElementById('dropzone');
const addStatus=document.getElementById('addStatus');
const recentList=document.getElementById('recentList');

pickBtn.addEventListener('click',()=>filePicker.click());
filePicker.addEventListener('change',e=>handleFiles(e.target.files));
dropzone.addEventListener('dragover',e=>{e.preventDefault();dropzone.classList.add('hover');});
dropzone.addEventListener('dragleave',()=>dropzone.classList.remove('hover'));
dropzone.addEventListener('drop',e=>{e.preventDefault();dropzone.classList.remove('hover');handleFiles(e.dataTransfer.files);});

async function handleFiles(files){
  let added=0;
  for(const file of files){await saveMedia(file);added++;}
  addStatus.textContent=`${added} file(s) added`;
  loadRecent();
  renderLibrary();
}

async function loadRecent(){
  const media=await getAllMedia();
  recentList.innerHTML='';
  media.slice(-5).reverse().forEach(item=>{
    const li=document.createElement('li');
    const a=document.createElement('a');
    a.href='#';
    a.textContent=item.name;
    a.addEventListener('click',()=>loadPlayer(item.id));
    li.appendChild(a);
    recentList.appendChild(li);
  });
}

// Library logic
const libraryList=document.getElementById('libraryList');
const searchInput=document.getElementById('searchInput');
const emptyMsg=document.getElementById('emptyMsg');

async function renderLibrary(filter=''){
  const media=await getAllMedia();
  libraryList.innerHTML='';
  const filtered=media.filter(i=>i.name.toLowerCase().includes(filter.toLowerCase()));
  if(!filtered.length){emptyMsg.style.display='block';return;}
  emptyMsg.style.display='none';
  filtered.sort((a,b)=>b.created-a.created).forEach(item=>{
    const li=document.createElement('li');
    const a=document.createElement('a');
    a.href='#';
    a.textContent=item.name;
    a.addEventListener('click',()=>loadPlayer(item.id));
    li.appendChild(a);
    const delBtn=document.createElement('button');
    delBtn.textContent='🗑️';
    delBtn.className='btn small danger';
    delBtn.addEventListener('click',async e=>{e.stopPropagation();await deleteMedia(item.id);renderLibrary();loadRecent();});
    li.appendChild(delBtn);
    libraryList.appendChild(li);
  });
}

searchInput.addEventListener('input',()=>renderLibrary(searchInput.value));

// Player logic
const video=document.getElementById('videoPlayer');
const audio=document.getElementById('audioPlayer');
const seekSlider=document.getElementById('seekSlider');
const volumeSlider=document.getElementById('volumeSlider');
const playPauseBtn=document.getElementById('playPauseBtn');
const titleEl=document.getElementById('nowPlayingTitle');

let activeEl=null;

async function loadPlayer(id){
  const item=await getMediaById(id);
  if(!item) return;
  const url=arrayBufferToObjectURL(item.data,item.type);
  const isVideo=item.type.startsWith('video');
  activeEl=isVideo?video:audio;
  activeEl.src=url; activeEl.style.display='block';
  (isVideo?audio:video).style.display='none';
  titleEl.textContent=`Now Playing: ${item.name}`;
  showView('player');
  activeEl.play();
}

playPauseBtn.addEventListener('click',()=>{if(activeEl){activeEl.paused?activeEl.play():activeEl.pause();}});
volumeSlider.addEventListener('input',()=>{if(activeEl) activeEl.volume=volumeSlider.value;});
seekSlider.addEventListener('input',()=>{if(activeEl&&activeEl.duration){activeEl.currentTime=(seekSlider.value/100)*activeEl.duration;}});
setInterval(()=>{if(activeEl&&activeEl.duration) seekSlider.value=(activeEl.currentTime/activeEl.duration)*100;},200);

// Init
showView('home');
loadRecent();
renderLibrary();
document.getElementById('year').textContent=new Date().getFullYear();
