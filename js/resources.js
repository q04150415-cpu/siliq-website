/* Resources Page - Download Modal */
(function() {
    var modal = document.getElementById('downloadModal');
    var form = document.getElementById('downloadForm');
    var closeBtn = document.getElementById('modalClose');
    var backdrop = modal.querySelector('.download-modal-backdrop');
    var successEl = document.getElementById('downloadSuccess');
    var modalTitle = document.getElementById('modalTitle');
    var modalDesc = document.getElementById('modalDesc');
    var resourceInput = document.getElementById('resourceName');
    var fieldsDefault = document.getElementById('fieldsDefault');
    var fieldsHealthcheck = document.getElementById('fieldsHealthcheck');

    var resourceNames = {
        'brand-checklist': '品牌行銷健檢表',
        'content-calendar': '社群內容月曆模板',
        'video-script': '短影音腳本公式',
        'marketing-healthcheck': '行銷健檢表 — 自我檢測'
    };

    var currentResource = '';

    // Open modal
    document.querySelectorAll('.resource-download-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var resource = this.dataset.resource;
            currentResource = resource;
            resourceInput.value = resource;
            modalTitle.textContent = '下載：' + (resourceNames[resource] || '免費資源');
            form.style.display = 'block';
            successEl.style.display = 'none';

            // Switch form fields based on resource type
            if (resource === 'marketing-healthcheck') {
                fieldsDefault.style.display = 'none';
                fieldsHealthcheck.style.display = 'block';
                modalDesc.textContent = '留下你的 IG 帳號與行業，即可免費領取';
                // Set required
                document.getElementById('dlInstagram').required = true;
                document.getElementById('dlIndustry').required = true;
                document.getElementById('dlName').required = false;
                document.getElementById('dlEmail').required = false;
            } else {
                fieldsDefault.style.display = 'block';
                fieldsHealthcheck.style.display = 'none';
                modalDesc.textContent = '留下你的 Email，我們會將資源寄送給你';
                document.getElementById('dlInstagram').required = false;
                document.getElementById('dlIndustry').required = false;
                document.getElementById('dlName').required = true;
                document.getElementById('dlEmail').required = true;
            }

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
        var resource = resourceInput.value;
        var leadData;

        if (resource === 'marketing-healthcheck') {
            var instagram = document.getElementById('dlInstagram').value.trim();
            var industry = document.getElementById('dlIndustry').value;
            if (!instagram || !industry) return;

            leadData = {
                instagram: instagram,
                industry: industry,
                resource: resource,
                date: new Date().toISOString()
            };

            // Reset healthcheck fields
            document.getElementById('dlInstagram').value = '';
            document.getElementById('dlIndustry').selectedIndex = 0;
        } else {
            var name = document.getElementById('dlName').value.trim();
            var email = document.getElementById('dlEmail').value.trim();
            if (!name || !email) return;

            leadData = {
                name: name,
                email: email,
                resource: resource,
                date: new Date().toISOString()
            };

            // Reset default fields
            document.getElementById('dlName').value = '';
            document.getElementById('dlEmail').value = '';
        }

        // Store lead info
        var leads = JSON.parse(localStorage.getItem('siliq_leads') || '[]');
        leads.push(leadData);
        localStorage.setItem('siliq_leads', JSON.stringify(leads));

        // Show success, hide form
        form.style.display = 'none';
        successEl.style.display = 'block';

        // Set download link to HTML resource page
        var downloadBtn = document.getElementById('actualDownload');
        downloadBtn.href = '/resources/' + resource + '.html';
        downloadBtn.target = '_blank';
    });
})();
