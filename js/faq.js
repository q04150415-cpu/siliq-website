/* FAQ Page - Accordion & Filter */
(function() {
    // Accordion toggle
    document.querySelectorAll('.faq-question').forEach((btn, index) => {
        const answer = btn.closest('.faq-item').querySelector('.faq-answer');
        if (answer) {
            answer.id = 'faq-answer-' + index;
            btn.setAttribute('aria-controls', answer.id);
        }
        btn.setAttribute('aria-expanded', String(btn.closest('.faq-item').classList.contains('active')));
        btn.addEventListener('click', function() {
            const item = this.closest('.faq-item');
            const wasActive = item.classList.contains('active');

            // Close all
            document.querySelectorAll('.faq-item.active').forEach(i => {
                i.classList.remove('active');
                i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });

            // Toggle current
            if (!wasActive) {
                item.classList.add('active');
                this.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // Category filter
    document.querySelectorAll('.faq-cat-btn').forEach(btn => {
        btn.setAttribute('aria-pressed', String(btn.classList.contains('active')));
        btn.addEventListener('click', function() {
            document.querySelectorAll('.faq-cat-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-pressed', 'false');
            });
            this.classList.add('active');
            this.setAttribute('aria-pressed', 'true');

            const cat = this.dataset.cat;
            document.querySelectorAll('.faq-item').forEach(item => {
                if (cat === 'all' || item.dataset.cat === cat) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
})();
