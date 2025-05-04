const API_KEY_YT = 'AIzaSyBxchZg-FgevUjMIMVU_t9Nb-KM1ytGwHo';
const API_KEY_DRIVE = 'AIzaSyDCiqFhC1OVBcMvlX3fYJPFrkKcXCpUzGg';
const CHANNEL_ID = 'SimplificandoaSemiologia-LASEM';
const FOLDER_ID = '1tI5FR4UvJv6wK0QWl3YYA1xWnb3m29jk';
let videos = [];
let currentOrder = 'date';

async function fetchVideos() {
  try {
    // Primeiro buscamos o ID do canal usando o nome
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY_YT}&q=SimplificandoaSemiologia-LASEM&type=channel&part=id`
    );

    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('Canal não encontrado');
    }

    const channelId = channelData.items[0].id.channelId;

    // Agora buscamos os vídeos usando o ID do canal encontrado
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?key=${API_KEY_YT}&channelId=${channelId}&part=snippet,id&order=${currentOrder}&maxResults=50`
    );

    const videosData = await videosResponse.json();

    if (!videosData.items) {
      throw new Error('Nenhum vídeo encontrado');
    }

    videos = videosData.items
      .filter(item => item.id.kind === 'youtube#video')
      .map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        date: item.snippet.publishedAt,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || ''
      }));

    renderVideos();

  } catch (error) {
    console.error('Erro ao buscar vídeos:', error);
    document.getElementById('videoList').innerHTML =
      `<div class="alert alert-danger">Erro ao carregar vídeos: ${error.message}</div>`;
  }
}

function renderVideos() {
  const list = document.getElementById('videoList');
  list.innerHTML = '';

  if (videos.length === 0) {
    list.innerHTML = '<div class="alert alert-info">Nenhum vídeo disponível no momento.</div>';
    return;
  }

  videos.forEach(video => {
    const item = document.createElement('button');
    item.className = 'list-group-item list-group-item-action text-start video-item';
    item.innerHTML = `
      <div class="d-flex align-items-center">
        <img src="${video.thumbnail}" alt="${video.title}" class="rounded me-3" width="80">
        <div>
          <h6 class="mb-1">${video.title}</h6>
          <small class="text-muted">${new Date(video.date).toLocaleDateString()}</small>
        </div>
      </div>
    `;
    item.onclick = () => selectVideo(video, item);
    list.appendChild(item);
  });

  // Seleciona o primeiro vídeo automaticamente
  if (videos.length > 0) {
    selectVideo(videos[0], list.firstElementChild);
  }
}

function selectVideo(video, element = null) {
  // Remove a classe 'active' de todos os itens
  document.querySelectorAll('.video-item').forEach(item => {
    item.classList.remove('active');
  });

  // Se um elemento foi passado, adiciona a classe 'active' a ele
  if (element) {
    element.classList.add('active');
  }

  // Atualiza o player e a descrição
  document.getElementById('videoPlayer').src =
    `https://www.youtube.com/embed/${video.id}`;
  document.getElementById('videoTitle').textContent = video.title;
  document.getElementById('videoDescription').textContent =
    video.description || "Descrição não disponível";
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-bs-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-bs-theme', newTheme);
  localStorage.setItem('theme', newTheme);

  // Atualiza o ícone do tema
  const themeIcon = document.querySelector('.theme-toggle i');
  themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleOrder() {
  currentOrder = currentOrder === 'date' ? 'title' : 'date';
  
  videos.sort((a, b) => currentOrder === 'date' 
    ? new Date(b.date) - new Date(a.date)
    : a.title.localeCompare(b.title));

  document.getElementById('orderText').textContent = 
    currentOrder === 'date' ? 'Mais Recentes' : 'Ordem Alfabética';

  renderVideos();
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
  // Verificar preferência de tema
  const savedTheme = localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.body.setAttribute('data-bs-theme', savedTheme);

  // Configurar ícone do tema
  const themeIcon = document.querySelector('.theme-toggle i');
  themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';

  // Carregar vídeos
  fetchVideos();

  // Ativar tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });
});

// Função modificada para carregar PDFs
async function loadPDFs() {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${FOLDER_ID}'+in+parents&key=${API_KEY_DRIVE}`
    );
    const data = await response.json();
    
    const pdfGrid = document.getElementById('pdfList');
    pdfGrid.innerHTML = '';

    data.files.forEach(file => {
      if (file.mimeType === 'application/pdf') {
        const pdfCard = document.createElement('div');
        pdfCard.className = 'pdf-card';
        pdfCard.innerHTML = `
          <div class="card shadow-sm border-0 h-100">
            <img src="https://yt3.googleusercontent.com/B88ekhfCRZ734hDYd90a-P8WWgT9b6l2xG3Jq_Y5iqSeexRUBlKhjGFejvPEbxLW1x0NbP2vrQ=s160-c-k-c0x00ffffff-no-rj" 
                class="card-img-top pdf-thumbnail" 
                alt="Miniatura do PDF ${file.name}">
            <div class="card-body text-center">
              <h6 class="card-title text-truncate" title="${file.name}">
                ${file.name.replace('.pdf', '')}
              </h6>
              <button class="btn btn-outline-primary btn-sm mt-2 w-100" 
                      onclick="openPDF('${file.id}')">
                <i class="fas fa-eye me-1"></i> Visualizar
              </button>
            </div>
          </div>
        `;
        pdfGrid.appendChild(pdfCard);
      }
    });
  } catch (error) {
    console.error('Erro ao carregar PDFs:', error);
    pdfGrid.innerHTML = `
      <div class="alert alert-danger">
        Erro ao carregar materiais: ${error.message}
      </div>
    `;
  }
}

function openPDF(fileId) {
  const modal = new bootstrap.Modal(document.getElementById('pdfModal'));
  const modalFrame = document.getElementById('modalPDFViewer');
  modalFrame.src = `https://drive.google.com/file/d/${fileId}/preview`;
  modal.show();
}

// Adicione isto ao DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  loadPDFs();
});