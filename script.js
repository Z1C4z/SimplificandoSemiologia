const API_KEY = 'AIzaSyAbtqYl_i7SfU-dfP3b_8sJzoH4IImppYg';
    const CHANNEL_ID = 'SimplificandoaSemiologia-LASEM';
    let videos = [];
    let currentOrder = 'date';

    async function fetchVideos() {
      try {
        // Primeiro buscamos o ID do canal usando o nome
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&q=SimplificandoaSemiologia-LASEM&type=channel&part=id`
        );
        
        const channelData = await channelResponse.json();
        
        if (!channelData.items || channelData.items.length === 0) {
          throw new Error('Canal não encontrado');
        }
        
        const channelId = channelData.items[0].id.channelId;
        
        // Agora buscamos os vídeos usando o ID do canal encontrado
        const videosResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&channelId=${channelId}&part=snippet,id&order=${currentOrder}&maxResults=50`
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
      
      // Agrupar vídeos por tema (parte antes dos dois pontos)
      const groupedVideos = {};
      const ungroupedVideos = [];
      
      videos.forEach(video => {
        const colonIndex = video.title.indexOf(':');
        if (colonIndex > 0) {
          const theme = video.title.substring(0, colonIndex).trim();
          if (!groupedVideos[theme]) {
            groupedVideos[theme] = [];
          }
          groupedVideos[theme].push(video);
        } else {
          ungroupedVideos.push(video);
        }
      });
      
      // Renderizar vídeos agrupados
      for (const [theme, themeVideos] of Object.entries(groupedVideos)) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'video-group';
        
        // Criar elemento de título do grupo
        const groupTitle = document.createElement('div');
        groupTitle.className = 'video-group-title';
        groupTitle.innerHTML = `
          <span>
            <i class="fas fa-folder-open me-2"></i>${theme}
            <small class="ms-2">(${themeVideos.length} vídeo${themeVideos.length > 1 ? 's' : ''})</small>
          </span>
          <i class="fas fa-chevron-down"></i>
        `;
        
        // Adicionar evento de clique para expandir/recolher
        groupTitle.addEventListener('click', function() {
          const wasCollapsed = this.classList.contains('collapsed');
          const itemsContainer = this.nextElementSibling;
          
          if (wasCollapsed) {
            // Expandir
            this.classList.remove('collapsed');
            itemsContainer.classList.remove('collapsed');
            itemsContainer.style.maxHeight = itemsContainer.scrollHeight + 'px';
          } else {
            // Recolher
            this.classList.add('collapsed');
            itemsContainer.classList.add('collapsed');
            itemsContainer.style.maxHeight = '0';
          }
        });
        
        // Criar container para os itens do grupo
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'video-group-items';
        itemsContainer.style.maxHeight = itemsContainer.scrollHeight + 'px';
        
        // Adicionar vídeos ao container
        themeVideos.forEach(video => {
          const item = document.createElement('button');
          item.className = 'list-group-item list-group-item-action text-start video-item';
          item.innerHTML = `
            <div class="d-flex align-items-center">
              <img src="${video.thumbnail}" alt="${video.title}" class="rounded me-3" width="80">
              <div>
                <h6 class="mb-1">${video.title.substring(video.title.indexOf(':') + 1).trim()}</h6>
                <small class="text-muted">${new Date(video.date).toLocaleDateString()}</small>
              </div>
            </div>
          `;
          item.onclick = () => selectVideo(video, item);
          itemsContainer.appendChild(item);
        });
        
        // Montar a estrutura do grupo
        groupDiv.appendChild(groupTitle);
        groupDiv.appendChild(itemsContainer);
        list.appendChild(groupDiv);
      }
      
      // Renderizar vídeos não agrupados
      if (ungroupedVideos.length > 0) {
        const ungroupedDiv = document.createElement('div');
        ungroupedDiv.className = 'ungrouped-videos';
        
        const ungroupedTitle = document.createElement('div');
        ungroupedTitle.className = 'video-group-title';
        ungroupedTitle.innerHTML = `
          <span>
            <i class="fas fa-video me-2"></i>Outros Vídeos
            <small class="ms-2">(${ungroupedVideos.length} vídeo${ungroupedVideos.length > 1 ? 's' : ''})</small>
          </span>
        `;
        
        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'video-group-items';
        
        ungroupedVideos.forEach(video => {
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
          itemsContainer.appendChild(item);
        });
        
        ungroupedDiv.appendChild(ungroupedTitle);
        ungroupedDiv.appendChild(itemsContainer);
        list.appendChild(ungroupedDiv);
      }
      
      // Seleciona o primeiro vídeo automaticamente
      const firstItem = list.querySelector('.video-item');
      if (firstItem) {
        const firstVideo = videos[0];
        selectVideo(firstVideo, firstItem);
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
      videos.sort((a, b) => currentOrder === 'date' ? 
        new Date(b.date) - new Date(a.date) : 
        a.title.localeCompare(b.title));
      renderVideos();
      
      // Mostra feedback visual
      const toast = document.createElement('div');
      toast.className = 'position-fixed bottom-0 end-0 p-3';
      toast.style.zIndex = '11';
      toast.innerHTML = `
        <div class="toast show" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header bg-primary text-white">
            <strong class="me-auto">Ordenação alterada</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body">
            Vídeos ordenados por ${currentOrder === 'date' ? 'data' : 'título'}
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.remove();
      }, 3000);
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

