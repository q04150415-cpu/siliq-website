/* =============================================
   SILIQ 行銷 官網 - JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

    // --- Clear stale cache & Load Dynamic Content ---
    localStorage.removeItem('siliq_content');
    loadContent();

    // --- Header Scroll Effect ---
    const header = document.getElementById('header');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- Mobile Navigation ---
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        nav.classList.toggle('open');
        document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            nav.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // --- Scroll Animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.animate-up').forEach(el => observer.observe(el));

    // --- Active Nav Link on Scroll ---
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link:not(.nav-cta)');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            if (window.scrollY >= section.offsetTop - 120) {
                current = section.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.style.color = '';
            if (link.getAttribute('href') === `#${current}`) {
                link.style.color = 'var(--accent)';
            }
        });
    });

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
            }
        });
    });

    // --- Contact Form ---
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData);

            if (!data.name || !data.email || !data.message) {
                showNotification('請填寫所有必填欄位', 'error');
                return;
            }

            const btn = contactForm.querySelector('button[type="submit"]');
            btn.textContent = '送出中...';
            btn.disabled = true;

            setTimeout(() => {
                showNotification('感謝您的諮詢！我們會盡快與您聯繫。', 'success');
                contactForm.reset();
                btn.textContent = '送出諮詢';
                btn.disabled = false;
            }, 1500);
        });
    }

    function showNotification(message, type) {
        const existing = document.querySelector('.notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 100px; right: 24px; padding: 16px 28px;
            border-radius: 12px; font-size: 0.95rem; font-weight: 500;
            z-index: 9999; animation: slideIn 0.4s ease;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            ${type === 'success' ? 'background:#27ae60;color:#fff;' : 'background:#e74c3c;color:#fff;'}
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.4s ease forwards';
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }

    // Keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn { from{transform:translateX(100px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes slideOut { from{transform:translateX(0);opacity:1} to{transform:translateX(100px);opacity:0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    `;
    document.head.appendChild(style);

    // --- Video Lightbox ---
    initLightbox();
});

/* =============================================
   DYNAMIC CONTENT LOADER
   ============================================= */

const SERVICE_ICONS = {
    video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    ads: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>'
};

async function loadContent() {
    let data;

    // Priority: localStorage > JSON file
    const stored = localStorage.getItem('siliq_content');
    if (stored) {
        data = JSON.parse(stored);
    } else {
        try {
            const res = await fetch('data/content.json');
            data = await res.json();
        } catch (e) {
            return; // Use HTML defaults
        }
    }

    if (!data) return;

    // --- Hero ---
    if (data.hero) {
        const h = data.hero;
        const titleAccent = document.querySelector('.hero-title-accent');
        const heroTitle = document.querySelector('.hero-title');
        if (titleAccent && heroTitle) {
            titleAccent.textContent = h.titleAccent || '';
            // Update suffix text node
            const suffix = heroTitle.childNodes;
            for (let node of suffix) {
                if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    node.textContent = h.titleSuffix || '';
                }
            }
        }
        const subtitle = document.querySelector('.hero-subtitle');
        if (subtitle) subtitle.textContent = h.subtitle || '';

        const btnPrimary = document.querySelector('.hero-buttons .btn-primary');
        const btnOutline = document.querySelector('.hero-buttons .btn-outline');
        if (btnPrimary) btnPrimary.textContent = h.ctaPrimary || '';
        if (btnOutline) btnOutline.textContent = h.ctaSecondary || '';
    }

    // --- About ---
    if (data.about) {
        const a = data.about;
        const aboutH3 = document.querySelector('.about-content h3');
        if (aboutH3) aboutH3.textContent = a.title || '';

        const aboutPs = document.querySelectorAll('.about-content > p');
        if (a.paragraphs) {
            aboutPs.forEach((p, i) => {
                if (a.paragraphs[i]) p.textContent = a.paragraphs[i];
            });
        }

        if (a.features) {
            const featuresContainer = document.querySelector('.about-features');
            if (featuresContainer) {
                featuresContainer.innerHTML = a.features.map(f => `
                    <div class="feature-item">
                        <div class="feature-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        </div>
                        <div>
                            <strong>${escHtml(f.title)}</strong>
                            <p>${escHtml(f.desc)}</p>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    // --- Services ---
    if (data.services) {
        const grid = document.querySelector('.services-grid');
        if (grid) {
            grid.innerHTML = data.services.map((s, i) => `
                <div class="service-card animate-up${i % 3 === 1 ? ' delay-1' : i % 3 === 2 ? ' delay-2' : ''}">
                    <div class="service-icon">${SERVICE_ICONS[s.icon] || SERVICE_ICONS.video}</div>
                    <h3>${escHtml(s.title)}</h3>
                    <p>${escHtml(s.desc)}</p>
                    <div class="service-tags">
                        ${(s.tags || []).filter(Boolean).map(t => `<span>${escHtml(t)}</span>`).join('')}
                    </div>
                </div>
            `).join('');

            // Re-observe animations
            grid.querySelectorAll('.animate-up').forEach(el => {
                const obs = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
                    });
                }, { threshold: 0.15 });
                obs.observe(el);
            });
        }
    }

    // --- Portfolio ---
    if (data.portfolio) {
        const grid = document.querySelector('.portfolio-grid');
        if (grid) {
            grid.innerHTML = data.portfolio.map((p, i) => {
                const bgStyle = p.image
                    ? `background:url('${escAttr(p.image)}') center/cover no-repeat;`
                    : `background:linear-gradient(135deg, ${p.color || '#5b8a72'}, ${adjustColor(p.color || '#5b8a72', -30)});`;

                const viewsBadge = p.views
                    ? `<div class="portfolio-views"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3" fill="white"/></svg>${escHtml(p.views)}</div>`
                    : '';

                const playBtn = p.video
                    ? `<div class="portfolio-play"><div class="play-btn"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg></div></div>`
                    : '';

                return `
                <div class="portfolio-item animate-up${i % 3 === 1 ? ' delay-1' : i % 3 === 2 ? ' delay-2' : ''}" data-category="${escAttr(p.category)}" ${p.video ? `data-video="${escAttr(p.video)}" data-video-type="${escAttr(p.videoType || 'iframe')}"` : ''}>
                    <div class="portfolio-thumb">
                        <div class="portfolio-placeholder" style="${bgStyle}">
                            ${!p.image ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>' : ''}
                        </div>
                        ${viewsBadge}
                        ${playBtn}
                        <div class="portfolio-overlay">
                            <span class="portfolio-category">${escHtml(p.categoryName)}</span>
                            <h4>${escHtml(p.title)}</h4>
                            <p>${escHtml(p.desc)}</p>
                        </div>
                    </div>
                </div>`;
            }).join('');

            // Re-bind filter
            initPortfolioFilter();

            // Re-observe animations
            grid.querySelectorAll('.animate-up').forEach(el => {
                const obs = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
                    });
                }, { threshold: 0.15 });
                obs.observe(el);
            });
        }
    }

    // --- Stats ---
    if (data.stats) {
        const grid = document.querySelector('.stats-grid');
        if (grid) {
            grid.innerHTML = data.stats.map((s, i) => `
                <div class="stat-item animate-up${i > 0 ? ` delay-${i}` : ''}">
                    <div class="stat-number" data-target="${s.number}">0</div>
                    <div class="stat-suffix">${escHtml(s.suffix)}</div>
                    <div class="stat-label">${escHtml(s.label)}</div>
                </div>
            `).join('');

            // Re-observe counter animation
            const counterObs = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        animateCounters();
                        counterObs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            counterObs.observe(grid);

            // Re-observe animations
            grid.querySelectorAll('.animate-up').forEach(el => {
                const obs = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
                    });
                }, { threshold: 0.15 });
                obs.observe(el);
            });
        }
    }

    // --- Testimonials ---
    if (data.testimonials) {
        const track = document.getElementById('testimonials-track');
        const dotsContainer = document.getElementById('sliderDots');
        if (track) {
            track.innerHTML = data.testimonials.map(t => `
                <div class="testimonial-card">
                    <div class="testimonial-quote">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="32" height="32"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
                    </div>
                    <p class="testimonial-text">${escHtml(t.text)}</p>
                    <div class="testimonial-author">
                        <div class="author-avatar">${escHtml(t.avatar)}</div>
                        <div>
                            <strong>${escHtml(t.name)}</strong>
                            <span>${escHtml(t.title)}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            initSlider();
        }
    }

    // --- Contact ---
    if (data.contact) {
        const c = data.contact;
        const emailEl = document.querySelector('.contact-item:nth-child(1) p');
        const addrEl = document.querySelector('.contact-item:nth-child(2) p');
        if (emailEl) emailEl.textContent = c.email || '';
        if (addrEl) addrEl.textContent = c.address || '';

        // Footer contact
        const footerContact = document.querySelector('.footer-contact p');
        if (footerContact) footerContact.textContent = c.email || '';

        // Social links
        if (c.socials) {
            const socialLinks = document.querySelectorAll('.social-link');
            if (socialLinks[0] && c.socials.facebook) socialLinks[0].href = c.socials.facebook;
            if (socialLinks[1] && c.socials.instagram) socialLinks[1].href = c.socials.instagram;
            if (socialLinks[2] && c.socials.line) socialLinks[2].href = c.socials.line;
        }
    }
}

function initPortfolioFilter() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    // Apply initial filter based on active button
    const activeBtn = document.querySelector('.filter-btn.active');
    if (activeBtn && activeBtn.dataset.filter !== 'all') {
        const initFilter = activeBtn.dataset.filter;
        portfolioItems.forEach(item => {
            if (item.dataset.category !== initFilter) {
                item.classList.add('hidden');
            }
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;

            portfolioItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.classList.remove('hidden');
                    item.style.animation = 'fadeIn 0.4s ease forwards';
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
}

function initSlider() {
    const track = document.getElementById('testimonials-track');
    const cards = track.querySelectorAll('.testimonial-card');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dotsContainer = document.getElementById('sliderDots');
    let currentSlide = 0;
    let autoSlideInterval;

    if (cards.length === 0) return;

    // Create dots
    dotsContainer.innerHTML = '';
    cards.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.classList.add('slider-dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    });

    function goToSlide(index) {
        currentSlide = index;
        track.style.transform = `translateX(-${currentSlide * 100}%)`;
        document.querySelectorAll('.slider-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    prevBtn.addEventListener('click', () => {
        currentSlide = currentSlide <= 0 ? cards.length - 1 : currentSlide - 1;
        goToSlide(currentSlide);
        resetAutoSlide();
    });

    nextBtn.addEventListener('click', () => {
        currentSlide = currentSlide >= cards.length - 1 ? 0 : currentSlide + 1;
        goToSlide(currentSlide);
        resetAutoSlide();
    });

    function startAutoSlide() {
        autoSlideInterval = setInterval(() => {
            currentSlide = currentSlide >= cards.length - 1 ? 0 : currentSlide + 1;
            goToSlide(currentSlide);
        }, 5000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    startAutoSlide();
}

function animateCounters() {
    document.querySelectorAll('.stat-number').forEach(counter => {
        const target = parseInt(counter.dataset.target);
        const duration = 2000;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.floor(eased * target).toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString();
            }
        }
        requestAnimationFrame(updateCounter);
    });
}

// --- Video Lightbox ---
function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxVideo = document.getElementById('lightboxVideo');
    const lightboxClose = document.getElementById('lightboxClose');
    const backdrop = lightbox.querySelector('.lightbox-backdrop');

    if (!lightbox) return;

    function openLightbox(videoUrl, videoType) {
        if (videoType === 'ig') {
            window.open(videoUrl.replace('/embed/', '/'), '_blank');
            return;
        }
        if (videoType === 'gdrive') {
            // Extract file ID and use streaming format
            const match = videoUrl.match(/\/d\/([^/]+)/);
            if (match) {
                const fileId = match[1];
                lightboxVideo.innerHTML = `<video controls autoplay playsinline><source src="https://drive.google.com/uc?export=download&id=${fileId}" type="video/mp4"></video>`;
                // Fallback: if video fails, use iframe preview
                const video = lightboxVideo.querySelector('video');
                video.onerror = () => {
                    lightboxVideo.innerHTML = `<iframe src="https://drive.google.com/file/d/${fileId}/preview" allowfullscreen frameborder="0"></iframe>`;
                };
            }
        } else {
            lightboxVideo.innerHTML = `<iframe src="${videoUrl}" allowfullscreen allow="autoplay; encrypted-media; accelerometer; gyroscope" frameborder="0"></iframe>`;
        }
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function openImageLightbox(imageUrl) {
        lightboxVideo.innerHTML = `<img src="${imageUrl}" alt="成效數據">`;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => {
            const video = lightboxVideo.querySelector('video');
            if (video) video.pause();
            lightboxVideo.innerHTML = '';
        }, 350);
    }

    lightboxClose.addEventListener('click', closeLightbox);
    backdrop.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeLightbox();
    });

    // Delegate click on portfolio items
    document.addEventListener('click', (e) => {
        const item = e.target.closest('.portfolio-item[data-video]');
        if (item) {
            e.preventDefault();
            openLightbox(item.dataset.video, item.dataset.videoType);
            return;
        }
        // Stats image lightbox
        const statsItem = e.target.closest('.portfolio-item.portfolio-stats');
        if (statsItem) {
            e.preventDefault();
            const img = statsItem.querySelector('.portfolio-placeholder');
            const bgImage = img.style.background.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (bgImage) {
                openImageLightbox(bgImage[1]);
            }
        }
    });
}

// --- Utilities ---
function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escAttr(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function adjustColor(hex, amount) {
    hex = hex.replace('#', '');
    const num = parseInt(hex, 16);
    let r = Math.min(255, Math.max(0, (num >> 16) + amount));
    let g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    let b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}
