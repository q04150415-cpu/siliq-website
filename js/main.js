/* SILIQ — shared navigation, accessible work previews and homepage content. */
'use strict';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const escapeText = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const safeURL = value => {
    try { const url = new URL(value, document.baseURI); return ['http:', 'https:'].includes(url.protocol) ? url.href : '#'; }
    catch { return '#'; }
};

document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    const nav = document.getElementById('nav');
    const hamburger = document.getElementById('hamburger');
    const mobile = window.matchMedia('(max-width: 900px)');
    const main = document.querySelector('main') || document.querySelector('body > section');
    if (main) {
        if (!main.id) main.id = 'main-content';
        const skip = document.createElement('a');
        skip.className = 'skip-link'; skip.href = '#' + main.id; skip.textContent = '跳至主要內容';
        document.body.prepend(skip);
        main.tabIndex = -1;
    }
    const syncHeader = () => header?.classList.toggle('scrolled', window.scrollY > 20);
    syncHeader(); window.addEventListener('scroll', syncHeader, {passive: true});
    let menuOpen = false;
    function setMenu(open, returnFocus = false) {
        if (!nav || !hamburger) return;
        menuOpen = open && mobile.matches;
        nav.classList.toggle('open', menuOpen);
        hamburger.classList.toggle('active', menuOpen);
        hamburger.setAttribute('aria-expanded', String(menuOpen));
        hamburger.setAttribute('aria-label', menuOpen ? '關閉選單' : '開啟選單');
        nav.inert = mobile.matches && !menuOpen;
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        if (returnFocus) hamburger.focus();
    }
    if (nav && hamburger) {
        hamburger.setAttribute('aria-controls', nav.id);
        setMenu(false);
        hamburger.addEventListener('click', () => {
            setMenu(!menuOpen);
            if (menuOpen) requestAnimationFrame(() => { if (menuOpen) nav.querySelector('a')?.focus(); });
        });
        nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
        mobile.addEventListener('change', () => setMenu(false));
        document.addEventListener('keydown', event => {
            if (!menuOpen) return;
            if (event.key === 'Escape') { setMenu(false, true); return; }
            if (event.key === 'Tab') {
                const items = [hamburger, ...nav.querySelectorAll('a[href]')];
                trapFocus(event, items);
            }
        });
    }
    document.addEventListener('click', event => {
        const anchor = event.target.closest('a[href^="#"]');
        if (!anchor) return;
        const hash = anchor.getAttribute('href');
        const target = hash === '#' ? document.documentElement : document.getElementById(hash.slice(1));
        if (!target) return;
        event.preventDefault();
        if (hash !== '#') history.replaceState(null, '', hash);
        window.scrollTo({top: hash === '#' ? 0 : Math.max(0, target.getBoundingClientRect().top + window.scrollY - (header?.offsetHeight || 0) - 24), behavior: reducedMotion.matches ? 'instant' : 'smooth'});
        if (target !== document.documentElement) {
            if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
            target.focus({preventScroll: true});
        }
    });
    // Current section is reflected without overwriting active subpage navigation.
    if (document.body.classList.contains('home-page') && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                nav?.querySelectorAll('a[href^="#"]').forEach(link => {
                    const active = link.hash === '#' + entry.target.id;
                    link.classList.toggle('active', active);
                    if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
                });
            });
        }, {rootMargin: '-15% 0px -65% 0px'});
        document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
    }
    initLightbox();
    initContact();
    if (document.body.classList.contains('home-page')) {
        initPortfolioFilter();
        loadContent();
    }
});

function trapFocus(event, elements) {
    const items = elements.filter(el => !el.hidden && !el.disabled && el.getClientRects().length);
    const first = items[0], last = items[items.length - 1];
    if (!first) return;
    if (event.shiftKey && (document.activeElement === first || !items.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
}

function initPortfolioFilter() {
    const section = document.getElementById('portfolio');
    if (!section) return;
    const apply = filter => {
        section.querySelectorAll('.portfolio-item').forEach(item => {
            item.hidden = filter === 'featured' ? item.dataset.featured !== 'true' : item.dataset.category !== filter;
            item.classList.remove('is-lead');
        });
        section.querySelector('.portfolio-item:not([hidden])')?.classList.add('is-lead');
        section.querySelectorAll('.filter-btn').forEach(button => {
            const active = button.dataset.filter === filter;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
    };
    section.querySelectorAll('.filter-btn').forEach(button => {
        button.addEventListener('click', () => apply(button.dataset.filter));
    });
    apply(section.querySelector('.filter-btn.active')?.dataset.filter || 'featured');
    section.applyFilter = apply;
}

async function loadContent() {
    try {
        const response = await fetch('data/content.json', {cache: 'no-cache'});
        if (!response.ok) throw new Error('Content unavailable');
        const data = await response.json();
        if (data.hero) {
            const h = data.hero;
            document.querySelector('.hero-title-accent').textContent = h.titleAccent || '';
            document.querySelector('.hero-title-suffix').textContent = h.titleSuffix || '';
            document.querySelector('.hero-subtitle').textContent = h.subtitle || '';
            document.querySelector('.hero-buttons .btn-primary').innerHTML = `${escapeText(h.ctaPrimary)} <span aria-hidden="true">↗</span>`;
            document.querySelector('.hero-buttons .text-link').innerHTML = `${escapeText(h.ctaSecondary)} <span aria-hidden="true">↗</span>`;
        }
        if (data.about) {
            document.querySelector('.about-content h3').textContent = data.about.title;
            document.querySelectorAll('.about-content > p').forEach((p, i) => { if (data.about.paragraphs?.[i]) p.textContent = data.about.paragraphs[i]; });
            document.querySelectorAll('.feature-item').forEach((item, i) => {
                const feature = data.about.features?.[i];
                if (feature) { item.querySelector('strong').textContent = feature.title; item.querySelector('p').textContent = feature.desc; }
            });
        }
        if (Array.isArray(data.services)) {
            document.querySelector('.services-grid').innerHTML = data.services.map(s => `<article class="service-card"><div class="service-icon" aria-hidden="true">${SERVICE_ICONS[s.icon] || SERVICE_ICONS.video}</div><h3>${escapeText(s.title)}</h3><p>${escapeText(s.desc)}</p><div class="service-tags">${(s.tags || []).map(tag => `<span>${escapeText(tag)}</span>`).join('')}</div><a href="#contact" class="service-cta" data-service="${escapeText(s.title)}">聊聊${escapeText(s.title)} <span aria-hidden="true">↗</span></a></article>`).join('');
        }
        if (Array.isArray(data.portfolio)) {
            const selected = ['老娘教你很系列', '低預算改裝系列', '阿美上班不無聊'];
            const featured = data.portfolio.filter(p => selected.includes(p.title));
            // Keep a stable three-project selection even if titles are edited.
            data.portfolio.filter(p => p.category === 'video').forEach(p => { if (featured.length < 3 && !featured.includes(p)) featured.push(p); });
            const ordered = [...featured, ...data.portfolio.filter(p => !featured.includes(p))];
            document.querySelector('.portfolio-grid').innerHTML = ordered.map(p => renderPortfolio(p, featured.includes(p))).join('');
            const section = document.getElementById('portfolio');
            section.applyFilter?.(section.querySelector('.filter-btn.active')?.dataset.filter || 'featured');
        }
        if (Array.isArray(data.testimonials)) {
            document.querySelector('#testimonials-track').innerHTML = data.testimonials.map(t => `<article class="testimonial-card"><div class="testimonial-quote" aria-hidden="true">“</div><p class="testimonial-text">${escapeText(t.text)}</p><div class="testimonial-author"><div class="author-avatar" aria-hidden="true">${escapeText(t.avatar)}</div><div><strong>${escapeText(t.name)}</strong><span>${escapeText(t.title)}</span></div></div></article>`).join('');
        }
        if (data.contact) {
            const c = data.contact;
            if (c.email) {
                document.querySelector('.contact-item p').innerHTML = `<a href="mailto:${escapeText(c.email)}">${escapeText(c.email)}</a>`;
                document.querySelector('.footer-contact p').textContent = c.email;
                document.getElementById('contactForm').dataset.email = c.email;
            }
            if (c.address) document.querySelectorAll('.contact-item p')[1].textContent = c.address;
            if (c.socials) {
                for (const name of ['facebook','instagram','line']) {
                    const link = document.querySelector(`.social-link[aria-label="${name === 'line' ? 'LINE' : name[0].toUpperCase()+name.slice(1)}"]`);
                    if (link && c.socials[name]) link.href = safeURL(c.socials[name]);
                }
                if (c.socials.line) document.querySelectorAll('a[href*="line.me"]').forEach(a => { a.href = safeURL(c.socials.line); });
            }
        }
        document.documentElement.dataset.contentSource = 'json';
    } catch (error) {
        // All important content and links also exist in HTML for offline/error fallback.
        document.documentElement.dataset.contentSource = 'html';
    }
}

function renderWorkAnalysis(strategy) {
    if (!strategy?.intent || !strategy?.trust) return '';
    return `<dl class="work-analysis"><div><dt>設計思路</dt><dd>${escapeText(strategy.intent)}</dd></div><div><dt>信任價值</dt><dd>${escapeText(strategy.trust)}</dd></div></dl>`;
}

function renderPortfolio(p, featured) {
    const url = safeURL(p.videoType === 'ig' ? p.video.replace('/embed/', '/') : (p.video || p.image));
    const external = p.videoType === 'ig';
    const type = p.video ? 'video' : 'image';
    const linkAttrs = external ? 'target="_blank" rel="noopener"' : `data-preview="${type}"`;
    const action = p.video ? (external ? '前往 Instagram 觀看' : '播放作品影片') : '查看成效紀錄';
    return `<article class="portfolio-item" data-category="${escapeText(p.category)}" data-featured="${featured}">
      <div class="portfolio-thumb">
        <a class="portfolio-media-link" href="${escapeText(url)}" ${linkAttrs} aria-label="${escapeText(action)}：${escapeText(p.title)}${external ? '（另開視窗）' : ''}">
          <span class="work-stage-label" aria-hidden="true">SILIQ — WORK COLLECTION</span>
          <img class="portfolio-image" src="${escapeText(safeURL(p.image))}" alt="${escapeText(p.title)}作品" loading="lazy" width="360" height="640">
          <span class="work-stage-type" aria-hidden="true">${p.video ? 'MOTION / STORIES' : 'SOCIAL / INSIGHTS'}</span>
          <span class="portfolio-play" aria-hidden="true"><span class="play-btn">${p.video ? '▶' : '↗'}</span></span>
        </a>
      </div>
      <div class="portfolio-caption">
        <div class="work-meta"><span class="portfolio-category">${escapeText(p.categoryName)}</span><span class="work-index" aria-hidden="true"></span></div>
        <h3><a href="${escapeText(url)}" ${linkAttrs}>${escapeText(p.title)}</a></h3>
        <p>${escapeText(p.desc)}</p>
        ${renderWorkAnalysis(p.strategy)}
        ${p.views ? `<div class="work-result"><strong>${escapeText(p.views)}</strong><span>${p.video ? '影片觀看次數' : '成效紀錄'}</span></div>` : ''}
        <a class="work-link" href="${escapeText(url)}" ${linkAttrs}>${escapeText(action)}<span aria-hidden="true">↗</span></a>
      </div>
    </article>`;
}

function initContact() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    document.addEventListener('click', event => {
        const link = event.target.closest('[data-service]');
        if (!link) return;
        const select = form.elements.service;
        const option = [...select.options].find(option => option.text === link.dataset.service);
        if (option) select.value = option.value;
    });
    form.addEventListener('submit', event => {
        event.preventDefault();
        const data = new FormData(form);
        const name = String(data.get('name') || '').trim();
        const message = String(data.get('message') || '').trim();
        const status = document.getElementById('contactStatus');
        if (!name || !message) { status.textContent = '請填寫姓名與需求內容，方便我們了解你的計畫。'; return; }
        const service = form.elements.service.selectedOptions[0].text;
        const email = form.dataset.email || 'siliq369.service@gmail.com';
        const body = `您好，我想諮詢品牌服務。\n\n姓名：${name}\nEmail：${data.get('email')}\n需求服務：${service}\n\n${message}`;
        const mailto = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('SILIQ 品牌諮詢｜' + name)}&body=${encodeURIComponent(body)}`;
        const draft = document.createElement('a'); draft.href = mailto; draft.click();
        status.innerHTML = `請在郵件 App 中確認並寄出，這裡會保留你填寫的內容。若未開啟，可 <a href="${escapeText(mailto)}">再次開啟草稿</a>，或透過 LINE 聯繫。`;
    });
}

function initLightbox() {
    const dialog = document.getElementById('lightbox');
    if (!dialog) return;
    const container = document.getElementById('lightboxVideo');
    const close = document.getElementById('lightboxClose');
    let trigger;
    function closeDialog() {
        if (!dialog.classList.contains('active')) return;
        dialog.classList.remove('active'); dialog.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        container.replaceChildren();
        trigger?.focus();
    }
    document.addEventListener('click', event => {
        const link = event.target.closest('a[data-preview]');
        if (!link) return;
        event.preventDefault(); trigger = link;
        container.replaceChildren();
        if (link.dataset.preview === 'image') {
            const img = document.createElement('img'); img.src = link.href;
            img.alt = link.closest('.portfolio-item')?.querySelector('h3')?.textContent || '作品成效'; container.append(img);
        } else {
            const iframe = document.createElement('iframe'); iframe.src = link.href;
            iframe.title = link.closest('.portfolio-item')?.querySelector('h3')?.textContent || '作品影片';
            iframe.allow = 'fullscreen'; iframe.allowFullscreen = true; iframe.setAttribute('frameborder', '0'); container.append(iframe);
        }
        const source = document.createElement('a'); source.href = link.href; source.target = '_blank'; source.rel = 'noopener'; source.className = 'lightbox-source'; source.textContent = '預覽無法載入？另開作品原始連結 ↗'; container.append(source);
        dialog.classList.add('active'); dialog.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; close.focus();
    });
    close.addEventListener('click', closeDialog);
    dialog.querySelector('.lightbox-backdrop').addEventListener('click', closeDialog);
    document.addEventListener('keydown', event => {
        if (!dialog.classList.contains('active')) return;
        if (event.key === 'Escape') closeDialog();
        if (event.key === 'Tab') trapFocus(event, [...dialog.querySelectorAll('button,a[href],iframe')]);
    });
}

const SERVICE_ICONS = {
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    ads: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>'
};
