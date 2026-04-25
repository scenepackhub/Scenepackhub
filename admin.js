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

// ===== TAB MANAGEMENT =====

function initTabs() {
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');

            if (tabName === 'manage') {
                renderManageScenepacks();
            } else if (tabName === 'analytics') {
                updateAnalytics();
            }
        });
    });
}

// ===== ADD SCENEPACK FORM =====

let selectedTags = [];
let editingId = null;

function initAddForm() {
    const form = document.getElementById('addForm');
    const tagsInput = document.getElementById('tagsInput');
    const imageUpload = document.getElementById('imageUpload');

    // Image preview
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const preview = document.getElementById('imagePreview');
                preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
                preview.classList.add('active');
                imageUpload.dataset.base64 = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Tags input
    tagsInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = tagsInput.value.trim().toLowerCase();
            if (tag && !selectedTags.includes(tag)) {
                selectedTags.push(tag);
                renderTags();
                tagsInput.value = '';
            }
        }
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const imageBase64 = imageUpload.dataset.base64;
        if (!imageBase64) {
            alert('Please upload an image');
            return;
        }

        const scenepack = {
            character: document.getElementById('characterName').value,
            show: document.getElementById('showName').value,
            category: document.getElementById('category').value,
            videoUrl: document.getElementById('videoUrl').value,
            image: imageBase64,
            tags: selectedTags
        };

        if (editingId) {
            updateScenepack(editingId, scenepack);
            editingId = null;
            form.reset();
            document.getElementById('imagePreview').classList.remove('active');
            selectedTags = [];
            renderTags();
            alert('Scenepack updated successfully!');
        } else {
            addScenepack(scenepack);
            form.reset();
            document.getElementById('imagePreview').classList.remove('active');
            selectedTags = [];
            renderTags();
            alert('Scenepack added successfully!');
        }

        renderManageScenepacks();
    });
}

function renderTags() {
    const display = document.getElementById('tagsDisplay');
    display.innerHTML = selectedTags.map(tag => `
        <div class="tag-item">
            ${tag}
            <button type="button" onclick="removeTag('${tag}')">×</button>
        </div>
    `).join('');
}

function removeTag(tag) {
    selectedTags = selectedTags.filter(t => t !== tag);
    renderTags();
}

// ===== MANAGE SCENEPACKS =====

function renderManageScenepacks() {
    const container = document.getElementById('scenepacksList');
    const emptyState = document.getElementById('emptyManage');
    const searchValue = document.getElementById('manageSearch')?.value || '';

    let scenepacks = getScenepacks();

    if (searchValue) {
        const q = searchValue.toLowerCase();
        scenepacks = scenepacks.filter(s =>
            s.character.toLowerCase().includes(q) ||
            s.show.toLowerCase().includes(q)
        );
    }

    container.innerHTML = '';

    if (scenepacks.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    scenepacks.forEach(scenepack => {
        const item = document.createElement('div');
        item.className = 'scenepack-item';
        item.innerHTML = `
            <img src="${scenepack.image}" alt="${scenepack.character}" class="scenepack-item-image" onerror="this.src='https://via.placeholder.com/150x100'">
            <div class="scenepack-item-info">
                <h3>${scenepack.character}</h3>
                <p><strong>${scenepack.show}</strong></p>
                <div class="scenepack-item-meta">
                    <span class="meta-tag">${scenepack.category}</span>
                    <span class="meta-tag">👁️ ${scenepack.views || 0}</span>
                    ${scenepack.tags.map(tag => `<span class="meta-tag">${tag}</span>`).join('')}
                </div>
            </div>
            <div class="scenepack-item-actions">
                <button class="btn-edit" onclick="editScenepack(${scenepack.id})">✏️ Edit</button>
                <button class="btn-delete" onclick="deleteScenepackConfirm(${scenepack.id})">🗑️ Delete</button>
            </div>
        `;
        container.appendChild(item);
    });
}

function editScenepack(id) {
    const scenepack = getScenepacks().find(s => s.id === id);
    if (!scenepack) return;

    document.getElementById('characterName').value = scenepack.character;
    document.getElementById('showName').value = scenepack.show;
    document.getElementById('category').value = scenepack.category;
    document.getElementById('videoUrl').value = scenepack.videoUrl;

    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `<img src="${scenepack.image}" alt="Preview">`;
    preview.classList.add('active');
    document.getElementById('imageUpload').dataset.base64 = scenepack.image;

    selectedTags = [...scenepack.tags];
    renderTags();

    editingId = id;

    // Scroll to form
    document.querySelector('.admin-tab-btn[data-tab="add"]').click();
    document.querySelector('form').scrollIntoView({ behavior: 'smooth' });
}

function deleteScenepackConfirm(id) {
    if (confirm('Are you sure you want to delete this scenepack?')) {
        deleteScenepack(id);
        renderManageScenepacks();
        alert('Scenepack deleted!');
    }
}

// Manage search
function initManageSearch() {
    const searchInput = document.getElementById('manageSearch');
    if (searchInput) {
        searchInput.addEventListener('input', renderManageScenepacks);
    }
}

// ===== ANALYTICS =====

function updateAnalytics() {
    const analytics = getAnalytics();
    const scenepacks = getScenepacks();
    const mostViewed = getMostViewed('week');

    document.getElementById('totalViews').textContent = analytics.totalViews;
    document.getElementById('weekViews').textContent = getViewsThisWeek();
    document.getElementById('monthViews').textContent = getViewsThisMonth();
    document.getElementById('totalScenepacks').textContent = scenepacks.length;

    const mostViewedList = document.getElementById('mostViewedList');
    mostViewedList.innerHTML = mostViewed.length === 0 
        ? '<p style="opacity: 0.7;">No scenepacks yet.</p>'
        : mostViewed.map(sp => `
            <div class="most-viewed-item">
                <div class="most-viewed-item-name">
                    <h4>${sp.character}</h4>
                    <p>${sp.show}</p>
                </div>
                <div class="most-viewed-item-views">${sp.views || 0}</div>
            </div>
        `).join('');
}

// ===== BACKUP & IMPORT =====

function initBackup() {
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importFile = document.getElementById('importFile');
    const clearBtn = document.getElementById('clearAllBtn');

    exportBtn.addEventListener('click', () => {
        const data = exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scenepackhub-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    importBtn.addEventListener('click', () => {
        const file = importFile.files[0];
        if (!file) {
            alert('Please select a file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            if (importData(e.target.result)) {
                document.getElementById('importMessage').classList.remove('error');
                document.getElementById('importMessage').classList.add('success');
                document.getElementById('importMessage').textContent = '✅ Data imported successfully!';
                importFile.value = '';
                renderManageScenepacks();
                setTimeout(() => {
                    document.getElementById('importMessage').classList.remove('success');
                }, 3000);
            } else {
                document.getElementById('importMessage').classList.remove('success');
                document.getElementById('importMessage').classList.add('error');
                document.getElementById('importMessage').textContent = '❌ Failed to import data. Invalid JSON file.';
            }
        };
        reader.readAsText(file);
    });

    clearBtn.addEventListener('click', () => {
        if (confirm('⚠️ This will delete ALL scenepacks and analytics. This cannot be undone!\n\nAre you absolutely sure?')) {
            localStorage.removeItem(STORAGE_KEYS.scenepacks);
            localStorage.removeItem(STORAGE_KEYS.analytics);
            initializeData();
            renderManageScenepacks();
            updateAnalytics();
            alert('All data cleared!');
        }
    });
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initTabs();
    initAddForm();
    initManageSearch();
    initBackup();
    renderManageScenepacks();
});
