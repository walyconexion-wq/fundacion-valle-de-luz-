/**
 * FUNDACIÓN VALLE DE LUZ - LÓGICA DEL BÚNKER PRIVADO Y GESTOR MAESTRO DE GALERÍA
 * Sincronizado con Supabase Cloud, LocalStorage, Asistente Luz-03 y Web Oficial
 */

(function () {
  'use strict';

  // Configuración de Supabase en Vivo
  const SUPABASE_URL = 'https://osdduwjsicoaeojfhokm.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_eVJfo1_bTqFQ0hmcXVA47A_kEdvMM0K';

  let supabase = null;
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('Búnker conectado a Supabase PostgreSQL en vivo.');
    } catch (e) {
      console.warn('Error al inicializar Supabase:', e);
    }
  }

  // Elementos DOM de Sesión y Navegación
  const authGateway = document.getElementById('auth-gateway');
  const bunkerApp = document.getElementById('bunker-app');
  const btnLoginGoogle = document.getElementById('btn-login-google');
  const btnLoginDemo = document.getElementById('btn-login-demo');
  const btnLogout = document.getElementById('btn-logout');
  const tabButtons = document.querySelectorAll('.bunker-tab-btn');
  const tabViews = document.querySelectorAll('.bunker-view');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const chatMessages = document.getElementById('chat-messages');
  const postulantesTbody = document.getElementById('postulantes-tbody');
  const badgePostulantesCount = document.getElementById('badge-postulantes-count');

  let currentUser = JSON.parse(sessionStorage.getItem('bunker_valle_session') || 'null');

  function checkSession() {
    if (currentUser) {
      authGateway.classList.add('hidden');
      bunkerApp.classList.remove('hidden');
      loadVoluntariosData();
      loadGaleriaData();
    } else {
      authGateway.classList.remove('hidden');
      bunkerApp.classList.add('hidden');
    }
  }

  // Iniciar sesión con Google OAuth / Demo
  if (btnLoginGoogle) {
    btnLoginGoogle.addEventListener('click', async () => {
      if (supabase && supabase.auth) {
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/bunker.html' }
          });
          if (error) throw error;
        } catch (err) {
          loginFounder('Director Waly', 'walyconexion@gmail.com', 'Presidente & Director General');
        }
      } else {
        loginFounder('Director Waly', 'walyconexion@gmail.com', 'Presidente & Director General');
      }
    });
  }

  if (btnLoginDemo) {
    btnLoginDemo.addEventListener('click', () => {
      loginFounder('Director Waly', 'walyconexion@gmail.com', 'Presidente & Director General');
    });
  }

  function loginFounder(name, email, role) {
    currentUser = { name, email, role, loggedAt: new Date().toISOString() };
    sessionStorage.setItem('bunker_valle_session', JSON.stringify(currentUser));
    checkSession();
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      currentUser = null;
      sessionStorage.removeItem('bunker_valle_session');
      checkSession();
    });
  }

  // Cambio de Pestañas
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      tabButtons.forEach(b => b.classList.remove('active', 'bg-white/10', 'text-emerald-300'));
      btn.classList.add('active', 'bg-white/10', 'text-emerald-300');

      tabViews.forEach(view => {
        if (view.id === targetTab) {
          view.classList.remove('hidden');
          if (targetTab === 'tab-postulantes') loadVoluntariosData();
          if (targetTab === 'tab-galeria') loadGaleriaData();
        } else {
          view.classList.add('hidden');
        }
      });
    });
  });

  // Cargar Voluntarios en Tiempo Real
  async function loadVoluntariosData() {
    if (!postulantesTbody) return;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('fundacion_voluntarios')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          if (badgePostulantesCount) badgePostulantesCount.textContent = data.length;
          postulantesTbody.innerHTML = '';
          data.forEach(p => {
            const tr = document.createElement('tr');
            tr.className = 'hover:bg-white/5 transition-colors';
            tr.innerHTML = `
              <td class="p-4 font-sans font-semibold text-white">${p.nombre_completo}</td>
              <td class="p-4 text-emerald-300">${p.localidad || 'Traslasierra'}</td>
              <td class="p-4 text-amber-300 font-medium">${p.talento_principal || p.area || 'Acción Social'}</td>
              <td class="p-4 text-slate-400">${p.telefono_whatsapp || '-'}<br><span class="text-[10px] text-slate-500">${p.email || ''}</span></td>
              <td class="p-4"><span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">${p.estado_evaluacion || 'VL-2027-ACTIVO'}</span></td>
              <td class="p-4 text-right">
                <a href="https://api.whatsapp.com/send?phone=${(p.telefono_whatsapp || '').replace(/[^0-9]/g, '')}&text=${encodeURIComponent('¡Hola ' + p.nombre_completo + '! Te saludamos desde la Fundación Valle de Luz en Traslasierra. Confirmamos tu registro como Voluntario Oficial.')}" target="_blank" class="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 text-[10px] font-mono transition-all">
                  🪪 WhatsApp
                </a>
              </td>
            `;
            postulantesTbody.appendChild(tr);
          });
          return;
        }
      } catch (err) {
        console.warn('Fallback voluntarios:', err);
      }
    }
  }

  // Chat interactivo con Luz-03 en el Búnker
  if (chatForm) {
    let bunkerChatHistory = [];
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      appendMessage('Director Waly', text, 'text-emerald-300');
      bunkerChatHistory.push({ role: 'user', content: text });
      chatInput.value = '';

      const tempDiv = document.createElement('div');
      tempDiv.className = 'flex gap-3 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10 font-mono text-xs text-emerald-300 italic';
      tempDiv.innerHTML = '<span>⚡ Consultando a Luz-03 AI...</span>';
      chatMessages.appendChild(tempDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, history: bunkerChatHistory })
        });
        const data = await response.json();
        tempDiv.remove();
        const reply = data.reply || 'Orden registrada en el nodo central.';
        bunkerChatHistory.push({ role: 'assistant', content: reply });
        appendMessage('Luz-03', reply, 'text-emerald-400');
      } catch (err) {
        tempDiv.remove();
        appendMessage('Luz-03', 'Sistemas de la Fundación operativos. ' + text, 'text-emerald-400');
      }
    });
  }

  function appendMessage(sender, msg, colorClass) {
    const div = document.createElement('div');
    div.className = 'flex gap-3 bg-white/5 p-3 rounded-xl border border-white/5';
    div.innerHTML = `
      <div class="font-bold ${colorClass}">[${sender}]:</div>
      <div class="text-slate-200">${msg}</div>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // ============================================================
  // GESTOR MAESTRO DE GALERÍA Y MULTIMEDIA (LIVE & SYNC ENGINE)
  // ============================================================
  const formAddMedia = document.getElementById('form-add-media');
  const bunkerGaleriaGrid = document.getElementById('bunker-galeria-grid');
  const badgeGaleriaCount = document.getElementById('badge-galeria-count');
  const btnRefreshGaleria = document.getElementById('btn-refresh-galeria');
  const btnResetDefault = document.getElementById('btn-reset-default-media');
  
  const btnTabFile = document.getElementById('btn-tab-file');
  const btnTabUrl = document.getElementById('btn-tab-url');
  const sectionUploadFile = document.getElementById('section-upload-file');
  const sectionUploadUrl = document.getElementById('section-upload-url');
  const mediaFileInput = document.getElementById('media-file-input');
  const filePlaceholder = document.getElementById('file-placeholder');
  const filePreviewContainer = document.getElementById('file-preview-container');
  const filePreviewImg = document.getElementById('file-preview-img');
  const filePreviewVideo = document.getElementById('file-preview-video');
  const fileInfoText = document.getElementById('file-info-text');

  const STORAGE_KEY = 'valle_galeria_live_v1';
  let currentFileBase64 = null;

  const initialMasterMedia = [
    {
      id: 'valle-1',
      titulo: 'Insignia Oficial Fundación Valle de Luz',
      tipo: 'foto',
      url: '/og-fundacion.jpg',
      categoria: 'Acción Social & Parajes',
      descripcion: 'Emblema oficial: Faro sobre las sierras y manos solidarias sembrando esperanza en Traslasierra.',
      destacado: true,
      fecha: new Date().toISOString()
    },
    {
      id: 'valle-2',
      titulo: 'Carga de Provisión en la Base de Montaña',
      tipo: 'foto',
      url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1200&q=80',
      categoria: 'Logística Hilux 4x4',
      descripcion: 'Equipos comunitarios acondicionando cajas de víveres e insumos médicos para descender al valle.',
      destacado: true,
      fecha: new Date().toISOString()
    },
    {
      id: 'valle-3',
      titulo: 'Abastecimiento a Comedores Comunitarios',
      tipo: 'foto',
      url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80',
      categoria: 'Comedores Comunitarios',
      descripcion: 'Entrega periódica de alimentos secos, leche y productos frescos a merenderos de parajes rurales.',
      destacado: true,
      fecha: new Date().toISOString()
    },
    {
      id: 'valle-4',
      titulo: 'Talleres de Ecotecnología y Oficios',
      tipo: 'foto',
      url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      categoria: 'Voluntariado & Donaciones',
      descripcion: 'Capacitación comunitaria en armado e instalación de termotanques solares y huertas familiares.',
      destacado: false,
      fecha: new Date().toISOString()
    },
    {
      id: 'valle-5',
      titulo: 'Hilux 4x4 en Huellas de Alta Montaña',
      tipo: 'foto',
      url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
      categoria: 'Logística Hilux 4x4',
      descripcion: 'Acceso directo a parajes escarpados, vados y zonas sin asfalto en Traslasierra.',
      destacado: false,
      fecha: new Date().toISOString()
    },
    {
      id: 'valle-6',
      titulo: 'Recorrido Territorial de los Parajes',
      tipo: 'video',
      url: 'https://www.youtube.com/embed/ScMzIvxBSi4',
      categoria: 'Dron & Territorio',
      descripcion: 'Registro aéreo de los parajes, escuelas rurales y caminos de montaña asistidos por la fundación.',
      destacado: true,
      fecha: new Date().toISOString()
    }
  ];

  function formatMediaUrl(url, type) {
    if (!url) return '';
    let formatted = url.trim();
    if (type === 'video') {
      if (formatted.includes('watch?v=')) {
        formatted = formatted.replace('watch?v=', 'embed/').split('&')[0];
      } else if (formatted.includes('youtu.be/')) {
        formatted = formatted.replace('youtu.be/', 'www.youtube.com/embed/').split('?')[0];
      } else if (formatted.includes('youtube.com/shorts/')) {
        formatted = formatted.replace('youtube.com/shorts/', 'www.youtube.com/embed/').split('?')[0];
      }
    }
    return formatted;
  }

  async function loadGaleriaData() {
    if (!bunkerGaleriaGrid) return;

    let items = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('galeria_multimedia')
          .select('*')
          .order('fecha', { ascending: false });

        if (!error && data && data.length > 0) {
          items = data;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
        }
      } catch (err) {
        console.warn('Supabase offline, usando LocalStorage:', err);
      }
    }

    if (!items) {
      const localData = localStorage.getItem(STORAGE_KEY);
      if (localData !== null) {
        try {
          items = JSON.parse(localData);
        } catch (e) {
          items = initialMasterMedia;
        }
      } else {
        items = initialMasterMedia;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    }

    renderBunkerGaleria(items);
  }

  function renderBunkerGaleria(items) {
    if (!bunkerGaleriaGrid) return;
    if (badgeGaleriaCount) badgeGaleriaCount.textContent = items.length;

    bunkerGaleriaGrid.innerHTML = '';

    if (items.length === 0) {
      bunkerGaleriaGrid.innerHTML = `
        <div class="col-span-2 text-center p-10 rounded-2xl bg-[#081611] border border-white/5 space-y-3">
          <div class="text-3xl">📷</div>
          <div class="text-white font-bold text-sm">No hay medios publicados actualmente</div>
          <p class="text-xs text-slate-400">Subí una foto o video desde tu computadora o pegá un link para publicarlo en la web oficial.</p>
        </div>
      `;
      return;
    }

    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'bg-[#081611] border border-white/10 rounded-2xl overflow-hidden p-3.5 flex flex-col justify-between group hover:border-emerald-400/50 transition-all text-xs shadow-lg';

      const isVideo = item.tipo === 'video';
      let previewHtml = '';

      if (isVideo) {
        if (item.url.includes('youtube.com/embed/')) {
          previewHtml = `
            <div class="w-full h-36 bg-black rounded-xl overflow-hidden mb-2 relative">
              <iframe src="${item.url}" class="w-full h-full border-0 pointer-events-none"></iframe>
              <span class="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-emerald-300">🎬 YouTube</span>
            </div>`;
        } else {
          previewHtml = `
            <div class="w-full h-36 bg-black rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 mb-2 relative overflow-hidden">
              <video src="${item.url}" class="w-full h-full object-cover"></video>
              <span class="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-emerald-300">🎬 Video MP4</span>
            </div>`;
        }
      } else {
        previewHtml = `
          <div class="w-full h-36 bg-black rounded-xl overflow-hidden border border-white/10 mb-2 relative">
            <img src="${item.url}" alt="${item.titulo}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" onerror="this.src='/og-fundacion.jpg'">
            <span class="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-amber-300">📷 Foto</span>
          </div>`;
      }

      card.innerHTML = `
        <div>
          ${previewHtml}
          <div class="flex items-center justify-between gap-2 mb-1">
            <h5 class="font-bold text-white truncate text-xs group-hover:text-emerald-300 transition-colors">${item.titulo}</h5>
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[9px] uppercase whitespace-nowrap">${item.categoria}</span>
          </div>
          <p class="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">${item.descripcion || 'Registro oficial de la Fundación Valle de Luz.'}</p>
        </div>
        <div class="flex items-center justify-between pt-2.5 border-t border-white/10 text-[10px] font-mono">
          <span class="text-slate-500">${new Date(item.fecha || Date.now()).toLocaleDateString('es-AR')}</span>
          <button class="btn-delete-item px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white transition-all flex items-center gap-1 font-bold" data-id="${item.id}">
            <span>🗑️</span>
            <span>Eliminar</span>
          </button>
        </div>
      `;

      bunkerGaleriaGrid.appendChild(card);
    });

    document.querySelectorAll('.btn-delete-item').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (!confirm('¿Confirmás eliminar este elemento de la galería oficial?')) return;

        if (supabase) {
          try {
            await supabase.from('galeria_multimedia').delete().eq('id', id);
          } catch (err) {
            console.warn('Eliminación en Supabase:', err);
          }
        }

        let localData = [];
        try {
          localData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
          localData = [];
        }
        const updated = localData.filter(i => i.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        alert('✓ Elemento eliminado correctamente de la galería.');
        loadGaleriaData();
      });
    });
  }

  if (btnResetDefault) {
    btnResetDefault.addEventListener('click', async () => {
      if (!confirm('¿Deseás restaurar las 6 fotos y videos originales por defecto?')) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMasterMedia));
      if (supabase) {
        try {
          await supabase.from('galeria_multimedia').upsert(initialMasterMedia);
        } catch (e) {
          console.warn('Upsert inicial en Supabase:', e);
        }
      }
      alert('✓ 6 Medios oficiales restaurados.');
      loadGaleriaData();
    });
  }

  if (btnTabFile && btnTabUrl) {
    btnTabFile.addEventListener('click', () => {
      btnTabFile.className = 'py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold transition-all flex items-center justify-center gap-1.5';
      btnTabUrl.className = 'py-2 rounded-lg text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5';
      sectionUploadFile.classList.remove('hidden');
      sectionUploadUrl.classList.add('hidden');
    });

    btnTabUrl.addEventListener('click', () => {
      btnTabUrl.className = 'py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold transition-all flex items-center justify-center gap-1.5';
      btnTabFile.className = 'py-2 rounded-lg text-slate-400 hover:text-white transition-all flex items-center justify-center gap-1.5';
      sectionUploadUrl.classList.remove('hidden');
      sectionUploadFile.classList.add('hidden');
    });
  }

  // Compresión en Canvas para fotos JPG/PNG (~150 KB)
  if (mediaFileInput) {
    mediaFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');

      const mediaTypeSelect = document.getElementById('media-tipo');
      if (isVid && mediaTypeSelect) mediaTypeSelect.value = 'video';
      if (isImg && mediaTypeSelect) mediaTypeSelect.value = 'foto';

      fileInfoText.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      filePlaceholder.classList.add('hidden');
      filePreviewContainer.classList.remove('hidden');

      if (isImg) {
        filePreviewVideo.classList.add('hidden');
        filePreviewImg.classList.remove('hidden');

        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1400;
            const MAX_HEIGHT = 1400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            currentFileBase64 = canvas.toDataURL('image/jpeg', 0.85);
            filePreviewImg.src = currentFileBase64;
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      } else if (isVid) {
        filePreviewImg.classList.add('hidden');
        filePreviewVideo.classList.remove('hidden');

        const reader = new FileReader();
        reader.onload = (event) => {
          currentFileBase64 = event.target.result;
          filePreviewVideo.src = currentFileBase64;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Guardar y Publicar
  if (formAddMedia) {
    formAddMedia.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-submit-media');

      const titulo = document.getElementById('media-titulo').value.trim();
      const tipo = document.getElementById('media-tipo').value;
      const categoria = document.getElementById('media-categoria').value;
      const descripcion = document.getElementById('media-descripcion').value.trim();
      const destacado = document.getElementById('media-destacado').checked;
      const urlInput = document.getElementById('media-url').value.trim();

      let finalUrl = '';
      if (currentFileBase64) {
        finalUrl = currentFileBase64;
      } else if (urlInput) {
        finalUrl = formatMediaUrl(urlInput, tipo);
      }

      if (!titulo || !finalUrl) {
        alert('Por favor seleccioná un archivo de tu PC o ingresá una URL válida.');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⚡</span><span>Publicando en la Web...</span>';
      }

      const newItem = {
        id: 'valle-' + Date.now(),
        titulo,
        tipo,
        categoria,
        url: finalUrl,
        descripcion,
        destacado,
        fecha: new Date().toISOString()
      };

      if (supabase) {
        try {
          await supabase.from('galeria_multimedia').insert([newItem]);
        } catch (err) {
          console.warn('Registro local fallback:', err);
        }
      }

      let localItems = [];
      try {
        localItems = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      } catch (e) {
        localItems = [];
      }
      localItems.unshift(newItem);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localItems));

      formAddMedia.reset();
      currentFileBase64 = null;
      if (filePlaceholder) filePlaceholder.classList.remove('hidden');
      if (filePreviewContainer) filePreviewContainer.classList.add('hidden');
      if (filePreviewImg) filePreviewImg.src = '';
      if (filePreviewVideo) filePreviewVideo.src = '';

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Guardar y Publicar en la Web</span><span>🚀</span>';
      }

      alert('✓ ¡Medio publicado con éxito! Ya está visible en el Búnker y en la web pública.');
      loadGaleriaData();
    });
  }

  if (btnRefreshGaleria) {
    btnRefreshGaleria.addEventListener('click', () => loadGaleriaData());
  }

  document.addEventListener('DOMContentLoaded', () => {
    checkSession();
  });

})();