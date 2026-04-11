/* Blog listing page - load articles from articles.json */
(function() {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;

    fetch('./articles.json')
        .then(r => r.json())
        .then(articles => {
            // Sort by date descending
            articles.sort((a, b) => b.date.localeCompare(a.date));
            renderArticles(articles);
            setupFilters(articles);
        })
        .catch(err => {
            grid.innerHTML = '<p style="text-align:center;color:#888;grid-column:1/-1;">文章載入中...</p>';
        });

    function renderArticles(articles) {
        grid.innerHTML = articles.map(a => `
            <a href="./${a.slug}/" class="blog-card" data-category="${a.category}">
                ${a.cover ? `<img src="${a.cover.startsWith('http') ? a.cover : a.slug + '/cover.jpg'}" alt="${a.title}" class="blog-card-cover" loading="lazy">` : ''}
                <div class="blog-card-body">
                    <span class="blog-card-tag">${a.category}</span>
                    <h3 class="blog-card-title">${a.title}</h3>
                    <p class="blog-card-excerpt">${a.excerpt}</p>
                    <span class="blog-card-meta">${a.date} · ${a.readTime}</span>
                </div>
            </a>
        `).join('');
    }

    function setupFilters(articles) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const filter = this.dataset.filter;
                const filtered = filter === 'all' ? articles : articles.filter(a => a.category === filter);
                renderArticles(filtered);
            });
        });
    }
})();
