/* Resources Page - Download Modal */
(function() {
    const modal = document.getElementById('downloadModal');
    const form = document.getElementById('downloadForm');
    const closeBtn = document.getElementById('modalClose');
    const backdrop = modal.querySelector('.download-modal-backdrop');
    const successEl = document.getElementById('downloadSuccess');
    const modalTitle = document.getElementById('modalTitle');
    const resourceInput = document.getElementById('resourceName');

    const resourceNames = {
        'brand-checklist': '品牌行銷健檢表',
        'content-calendar': '社群內容月曆模板',
        'video-script': '短影音腳本公式'
    };

    // Open modal
    document.querySelectorAll('.resource-download-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const resource = this.dataset.resource;
            resourceInput.value = resource;
            modalTitle.textContent = '下載：' + (resourceNames[resource] || '免費資源');
            form.style.display = '';
            successEl.style.display = 'none';
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });

    // Form submit
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('dlName').value;
        const email = document.getElementById('dlEmail').value;
        const resource = resourceInput.value;

        if (!name || !email) return;

        // Store lead info
        const leads = JSON.parse(localStorage.getItem('siliq_leads') || '[]');
        leads.push({
            name: name,
            email: email,
            resource: resource,
            date: new Date().toISOString()
        });
        localStorage.setItem('siliq_leads', JSON.stringify(leads));

        // Show success
        form.style.display = 'none';
        successEl.style.display = '';

        // Set download link to HTML resource page
        const downloadBtn = document.getElementById('actualDownload');
        downloadBtn.href = './' + resource + '.html';
        downloadBtn.removeAttribute('download');
        downloadBtn.target = '_blank';

        // Reset form
        form.reset();
    });
})();
