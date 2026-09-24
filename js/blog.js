/* Searchable, paginated editorial library. */
(() => {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;
    const search = document.getElementById('blogSearch');
    const count = document.getElementById('blogCount');
    const more = document.getElementById('blogMore');
    const buttons = [...document.querySelectorAll('.blog-filters .filter-btn')];
    const categories = {
        '自媒體經營': ['PERSONAL BRANDING', 'personal'],
        '短影音製作': ['STORIES IN MOTION', 'video'],
        '廣告投放': ['REACH THE RIGHT PEOPLE', 'ads'],
        '品牌行銷': ['BUILD A MEANINGFUL BRAND', 'brand'],
        '社群經營': ['CREATE CONNECTIONS', 'social'],
        '行銷趨勢': ['IDEAS FOR WHAT’S NEXT', 'trends']
    };
    let articles = [], category = 'all', limit = 9;
    async function load() {
        grid.innerHTML = '<p class="blog-empty" role="status">正在載入行銷觀點…</p>';
        try {
            const response = await fetch('./articles.json');
            if (!response.ok) throw new Error('Unable to load articles');
            articles = await response.json();
            if (!Array.isArray(articles)) throw new Error('Invalid articles');
            articles.sort((a, b) => b.date.localeCompare(a.date));
            render();
        } catch {
            grid.innerHTML = '<div class="blog-empty" role="status"><p>文章暫時無法載入，請稍後再試。</p><button class="btn btn-outline" id="blogRetry">重新載入</button></div>';
            count.textContent = '';
            more.hidden = true;
            document.getElementById('blogRetry').addEventListener('click', load);
        }
    }
    function render() {
        const query = search.value.trim().toLocaleLowerCase();
        const filtered = articles.filter(a => (category === 'all' || a.category === category) && `${a.title} ${a.excerpt} ${a.category}`.toLocaleLowerCase().includes(query));
        const visible = filtered.slice(0, limit);
        count.textContent = `共 ${filtered.length} 篇觀點・顯示 ${visible.length} 篇`;
        more.hidden = filtered.length <= limit;
        if (!filtered.length) {
            grid.innerHTML = '<div class="blog-empty"><p>沒有找到符合的文章，試試其他關鍵字。</p><button class="btn btn-outline" id="clearSearch">清除搜尋與篩選</button></div>';
            document.getElementById('clearSearch').addEventListener('click', () => { search.value = ''; category = 'all'; limit = 9; syncButtons(); render(); search.focus(); });
            return;
        }
        grid.innerHTML = visible.map(a => {
            const [label, tone] = categories[a.category] || ['SILIQ JOURNAL', 'brand'];
            return `<a href="./${encodeURIComponent(a.slug)}/" class="blog-card"><div class="editorial-cover cover-${tone}" aria-hidden="true"><span class="cover-label">SILIQ JOURNAL / ${escapeText(a.date.slice(0, 4))}</span><strong>${escapeText(a.category)}</strong><span class="cover-bottom"><span>${label}</span><span>↗</span></span></div><div class="blog-card-body"><span class="blog-card-tag">${escapeText(a.category)}</span><h2 class="blog-card-title">${escapeText(a.title)}</h2><p class="blog-card-excerpt">${escapeText(a.excerpt)}</p><span class="blog-card-meta">${escapeText(a.date)} · ${escapeText(a.readTime)}</span></div></a>`;
        }).join('');
    }
    function syncButtons() {
        buttons.forEach(button => {
            const active = button.dataset.filter === category;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    }
    buttons.forEach(button => button.addEventListener('click', () => { category = button.dataset.filter; limit = 9; syncButtons(); render(); }));
    search.addEventListener('input', () => { limit = 9; render(); });
    more.addEventListener('click', () => {
        const previous = grid.children.length;
        limit += 9; render();
        grid.children[previous]?.focus({preventScroll: true});
    });
    syncButtons(); load();
})();
