document.addEventListener('DOMContentLoaded', () => {
    // 1. Set Current Date
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;
    }

    // 2. Form & Controls
    const form = document.getElementById('vendor-form');
    const saveSendBtn = document.getElementById('save-send-btn');
    const docCard = document.getElementById('intro-document');
    const successOverlay = document.getElementById('success-overlay');

    // Initialize Lucide Icons
    if (window.lucide) lucide.createIcons();

    // 3. Real-time Character Counter & Auto-Expand (Crucial for PDF visibility)
    const textareas = document.querySelectorAll('#vendor-form textarea[maxlength]');
    textareas.forEach(textarea => {
        const mirrorId = `mirror-${textarea.name}`;
        const mirrorEl = document.getElementById(mirrorId);

        const autoExpand = () => {
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';
            
            // Sync to mirror for high-fidelity printing
            if (mirrorEl) {
                mirrorEl.textContent = textarea.value;
            }
        };

        textarea.addEventListener('input', () => {
            // Count characters
            const currentLength = textarea.value.length;
            const maxLength = textarea.getAttribute('maxlength');
            const counterElement = document.getElementById(`count-${textarea.name}`);
            if (counterElement) {
                counterElement.textContent = `${currentLength.toLocaleString()} / ${parseInt(maxLength).toLocaleString()}`;
                counterElement.style.color = currentLength >= maxLength * 0.9 ? '#e53e3e' : '#94a3b8';
            }

            // Sync and Expand
            autoExpand();
        });

        // Initialize on load
        autoExpand();
    });

    // 4. Save Logic: High-Quality Searchable PDF (via Native Print)
    if (saveSendBtn) {
        saveSendBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // 1. Validation: Company Name (REQUIRED)
            const formData = new FormData(form);
            const companyNameKOR = formData.get('company_name_kor')?.trim() || '';
            const companyNameENG = formData.get('company_name_eng')?.trim() || '';
            
            if (!companyNameKOR && !companyNameENG) {
                alert('저장을 위해 업체명(국문 또는 영문)을 반드시 입력해 주세요.');
                return;
            }

            // 2. Trigger Native Print (Best for Searchable Text)
            // Dynamically set title for automatic PDF naming
            const originalTitle = document.title;
            const companyName = companyNameKOR || companyNameENG || 'Exhibitor_Information';
            document.title = companyName.replace(/[/\\?%*:|"<>]/g, '-'); // Sanitize for OS
            
            window.print();

            // 3. Restore original title after print dialog closes
            document.title = originalTitle;
            
            // 4. Success feedback
            setTimeout(() => {
                if (successOverlay) successOverlay.style.display = 'flex';
            }, 1000);
        });
    }

    // 5. Preview Mode (Native Scrolling)
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            if (docCard) {
                docCard.style.outline = '4px solid #3b82f6';
                setTimeout(() => docCard.style.outline = 'none', 1500);
            }
        });
    }
});
