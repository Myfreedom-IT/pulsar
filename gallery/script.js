const PLANETS = [
    { en: 'Mercury', ru: 'Меркурий' },
    { en: 'Venus', ru: 'Венера' },
    { en: 'Earth', ru: 'Земля' },
    { en: 'Mars', ru: 'Марс' },
    { en: 'Jupiter', ru: 'Юпитер' },
    { en: 'Saturn', ru: 'Сатурн' },
    { en: 'Uranus', ru: 'Уран' },
    { en: 'Neptune', ru: 'Нептун' },
];

let activePlanet = null;

const planetsEl = document.getElementById('planets');
const galleryEl = document.getElementById('gallery');
const statusEl = document.getElementById('status');
const modalRoot = document.getElementById('modal-root');

PLANETS.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'pbtn';
    btn.textContent = p.ru;
    btn.dataset.en = p.en;
    btn.onclick = () => loadPlanet(p);
    planetsEl.appendChild(btn);
});

async function loadPlanet(planet) {
    if (activePlanet === planet.en) return;
    activePlanet = planet.en;

    document.querySelectorAll('.pbtn').forEach(b =>
        b.classList.toggle('active', b.dataset.en === planet.en)
    );

    statusEl.textContent = 'Загружаем фотографии...';
    galleryEl.innerHTML = '';

    const apiUrl = `https://images-api.nasa.gov/search?q=${encodeURIComponent(planet.en + ' planet')}&media_type=image&page_size=50`;

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error('Ошибка сети: ' + res.status);

        const data = await res.json();
        const items = (data.collection?.items || [])
            .filter(i => i.links?.[0]?.href && i.data?.[0]);

        if (!items.length) {
            galleryEl.innerHTML = '<div class="error">Фотографии не найдены</div>';
            statusEl.textContent = '';
            return;
        }

        const total = data.collection?.metadata?.total_hits || items.length;
        statusEl.textContent = `${planet.ru} — показано ${Math.min(items.length, 50)} из ${total} фото`;

        items.slice(0, 50).forEach(item => {
            const imgSrc = item.links[0].href;
            const title = item.data[0].title || planet.en;
            const date = (item.data[0].date_created || '').slice(0, 10);
            const desc = item.data[0].description || '';
            const nasaId = item.data[0].nasa_id || '';

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
          <img src="${imgSrc}" alt="${title}" loading="lazy">
          <div class="card-info">
            <div class="card-title">${title}</div>
            <div class="card-date">${date}</div>
          </div>`;
            card.onclick = () => openModal(imgSrc, title, date, desc, nasaId);
            galleryEl.appendChild(card);
        });

    } catch (e) {
        galleryEl.innerHTML = `<div class="error">
        Не удалось загрузить данные.<br>
        Убедись, что открываешь файл через Live Server, а не через file://
      </div>`;
        statusEl.textContent = '';
        console.error(e);
    }
}

function openModal(src, title, date, desc, nasaId) {
    const link = nasaId
        ? `<a class="modal-link" href="https://images.nasa.gov/details-${nasaId}" target="_blank">Открыть на NASA ↗</a>`
        : '';

    modalRoot.innerHTML = `
      <div class="overlay" onclick="if(event.target===this)closeModal()">
        <div class="modal">
         <button class="modal-close" onclick="closeModal()">✕</button>
          <img src="${src}" alt="${title}">
          <div class="modal-body">
            <div class="modal-top">
              <h3>${title}</h3>
            </div>
            ${date ? `<div class="modal-date">${date}</div>` : ''}
            <p class="modal-desc">${desc ? desc.slice(0, 500) + (desc.length > 500 ? '…' : '') : 'Описание отсутствует.'}</p>
            ${link}
          </div>
        </div>
      </div>`;
}

function closeModal() {
    modalRoot.innerHTML = '';
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});