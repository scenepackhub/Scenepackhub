// ===== INITIALIZATION =====

function init() {
    initTheme();
    initCreditModal();
    initTabs();
    renderScenepacks('all');
    setupEventListeners();
}

// ===== THEME TOGGLE =====

function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
    const themeToggle = document.getElementById('themeToggle');

    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        themeToggle.checked = true;
    }

    themeToggle.addEventListener('change', () => {
        document.body.classList.toggle('light-theme');
        const theme = document.body.classList.contains('light-theme') ? 'light' : 'dark';
        localStorage.setItem(STORAGE_KEYS.theme, theme);
    });
}

// ===== CREDIT MODAL =====

function initCreditModal() {
    const modal = document.getElementById('creditModal');
    const closeBtn = document.querySelector('.close-modal');
    const closeBtn2 = document.getElementById('closeCredits');
    const modalShown = localStorage.getItem(STORAGE_KEYS.creditModalShown);

    if (!modalShown) {
        setTimeout(() => {
            modal.classList.add('active');
            localStorage.setItem(STORAGE_KEYS.creditModalShown, 'true');
        }, 500);
    }

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    closeBtn2.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// ===== TABS =====

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            renderScenepacks(tab);
        });
    });
}

function renderScenepacks(tab) {
    const container = document.getElementById('scenepacksContainer');
    const emptyState = document.getElementById('emptyState');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Update active tab
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`)?.classList.add('active');

    let scenepacks = [];

    if (tab === 'all') {
        scenepacks = getScenepacks();
    } else if (tab === 'recent') {
        scenepacks = getRecentScenepacks();
    }

    container.innerHTML = '';

    if (scenepacks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    scenepacks.forEach(scenepack => {
        const card = createScenepackCard(scenepack);
        container.appendChild(card);
    });
}

function createScenepackCard(scenepack) {
    const card = document.createElement('div');
    card.className = 'scenepack-card';

    card.innerHTML = `
        <div class="scenepack-image">
            <img src="${scenepack.image}" alt="${scenepack.character}" onerror="this.src='https://via.placeholder.com/300x200'">
            <div class="scenepack-views">👁️ ${scenepack.views || 0}</div>
            <div class="scenepack-overlay">
                <button class="btn-watch" onclick="openVideoModal(${scenepack.id})">▶️ Watch</button>
            </div>
        </div>
        <div class="scenepack-content">
            <h3 class="scenepack-title">${scenepack.character}</h3>
            <p class="scenepack-subtitle">${scenepack.show}</p>
            <div class="scenepack-meta">
                <span class="badge">${scenepack.category}</span>
            </div>
            <div class="scenepack-tags">
                ${scenepack.tags?.map(tag => `<span class="tag">${tag}</span>`).join('') || ''}
            </div>
        </div>
    `;

    // Track hover as view
    card.addEventListener('mouseenter', () => {
        trackView(scenepack.id);
    });

    return card;
}

// ===== VIDEO MODAL =====

function openVideoModal(scenepackId) {
    const scenepack = getScenepackById(scenepackId);
    if (!scenepack) return;

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content video-modal">
            <button class="close-modal" onclick="this.closest('.modal').remove()">×</button>
            <h2>${scenepack.character}</h2>
            <p style="color: var(--primary-color); font-weight: 600; margin-bottom: 1rem;">${scenepack.show}</p>
            <div class="video-container">
                <iframe 
                    width="100%" 
                    height="500" 
                    src="${scenepack.videoUrl}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
            <div class="credit-reminder">
                <p>Please tag @kasenccscenes or @kasen.cc on TikTok for credits! 🎬✨</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Track view
    trackView(scenepackId);
}

// ===== SEARCH & FILTER =====

function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);

    // Category filter
    renderCategoryFilters();
}

function renderCategoryFilters() {
    const filterContainer = document.getElementById('categoryFilter');
    const categories = getAllCategories();

    filterContainer.innerHTML = '<button class="filter-chip active" data-filter="all">All</button>';

    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = 'filter-chip';
        btn.dataset.filter = category;
        btn.textContent = category;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilters();
        });
        filterContainer.appendChild(btn);
    });

    // Add "All" button listener
    document.querySelector('[data-filter="all"]').addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-filter="all"]').classList.add('active');
        applyFilters();
    });
}

function handleSearch(e) {
    applyFilters();
}

function applyFilters() {
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const selectedCategory = document.querySelector('.filter-chip.active')?.dataset.filter;

    let scenepacks = getScenepacks();

    // Filter by search
    if (searchValue) {
        scenepacks = scenepacks.filter(sp =>
            sp.character.toLowerCase().includes(searchValue) ||
            sp.show.toLowerCase().includes(searchValue) ||
            sp.tags?.some(tag => tag.toLowerCase().includes(searchValue))
        );
    }

    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
        scenepacks = scenepacks.filter(sp => sp.category === selectedCategory);
    }

    const container = document.getElementById('scenepacksContainer');
    const emptyState = document.getElementById('emptyState');

    container.innerHTML = '';

    if (scenepacks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    scenepacks.forEach(scenepack => {
        const card = createScenepackCard(scenepack);
        container.appendChild(card);
    });
}

// ===== DOM READY =====

document.addEventListener('DOMContentLoaded', init);
