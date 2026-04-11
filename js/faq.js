/* FAQ Page - Accordion & Filter */
(function() {
    // Accordion toggle
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.faq-item');
            const wasActive = item.classList.contains('active');

            // Close all
            document.querySelectorAll('.faq-item.active').forEach(i => i.classList.remove('active'));

            // Toggle current
            if (!wasActive) {
                item.classList.add('active');
            }
        });
    });

    // Category filter
    document.querySelectorAll('.faq-cat-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.faq-cat-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

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
