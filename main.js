document.addEventListener('DOMContentLoaded', () => {
    // 1. Set Current Date
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;
    }

    // 2. Photo Preview Logic (Supports Multiple up to 5)
    const photoInput = document.getElementById('photo-input');
    const previewGrid = document.getElementById('photo-preview-box');
    const previewPlaceholder = document.getElementById('preview-placeholder');

    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            // Get files and limit to 5
            const files = Array.from(e.target.files).slice(0, 5);
            
            // Clear existing previews (except placeholder by default, we'll re-calculate)
            const children = Array.from(previewGrid.children);
            children.forEach(child => {
                if (child.id !== 'preview-placeholder') {
                    previewGrid.removeChild(child);
                }
            });

            if (files.length > 0) {
                previewPlaceholder.style.display = 'none';

                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const wrap = document.createElement('div');
                        wrap.className = 'preview-img-wrap';
                        
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        wrap.appendChild(img);

                        // Individual Remove Button
                        const removeBtn = document.createElement('button');
                        removeBtn.className = 'remove-photo-btn';
                        removeBtn.innerHTML = '&times;';
                        removeBtn.type = 'button';
                        removeBtn.onclick = (e) => {
                            e.stopPropagation();
                            wrap.remove();
                            // Show placeholder if empty
                            if (previewGrid.querySelectorAll('.preview-img-wrap').length === 0) {
                                previewPlaceholder.style.display = 'flex';
                            }
                        };
                        wrap.appendChild(removeBtn);
                        
                        previewGrid.appendChild(wrap);
                    };
                    reader.readAsDataURL(file);
                });
            } else {
                previewPlaceholder.style.display = 'block';
            }
            
            if (e.target.files.length > 5) {
                alert('최대 5장까지만 업로드 가능하여 상위 5장만 선택되었습니다.\n(Only up to 5 photos can be uploaded.)');
            }
        });
    }

    // 3. Mini Preview Logic (Logo, QR - 1 Each)
    function handleMiniPreview(inputSelector, previewBoxId) {
        const input = document.getElementById(inputSelector);
        const box = document.getElementById(previewBoxId);
        if (!input || !box) return;

        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const fileName = file.name.toLowerCase();
            const isImage = /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(fileName);

            box.innerHTML = ''; // Clear previous

            if (isImage) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    box.appendChild(img);
                };
                reader.readAsDataURL(file);
            } else {
                // Fallback for non-image design files (.ai, .eps, .pdf, etc.)
                const ext = fileName.split('.').pop().toUpperCase();
                const span = document.createElement('span');
                span.textContent = ext;
                span.style.color = '#3b82f6';
                span.style.fontWeight = '900';
                box.appendChild(span);
            }
        });
    }

    handleMiniPreview('logo-input', 'logo-preview-box');
    handleMiniPreview('qr-input', 'qr-preview-box');

    // 4. Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // 4. Form & Controls
    const form = document.getElementById('vendor-form');
    const saveSendBtn = document.getElementById('save-send-btn');
    const previewBtn = document.getElementById('preview-btn');
    const docCard = document.getElementById('intro-document');
    const successOverlay = document.getElementById('success-overlay');

    // 5. PDF Generation Options
    const opt = {
        margin: [10, 10, 10, 10],
        filename: 'Exhibitor_Information.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all', before: '.form-section' }
    };

    // 6. Save & Send Logic (Updated for potential long form)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI state: loading
        const btnText = saveSendBtn.querySelector('.btn-text');
        const btnLoading = saveSendBtn.querySelector('.btn-loading');
        
        saveSendBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        try {
            // High quality PDF generation
            await html2pdf().from(docCard).set(opt).save();

            // Success feedback
            setTimeout(() => {
                successOverlay.style.display = 'flex';
                saveSendBtn.disabled = false;
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }, 1000);

        } catch (error) {
            console.error('PDF Generation failed:', error);
            alert('PDF 생성 중 오류가 발생했습니다.');
            saveSendBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    });

    // 7. Preview Mode
    previewBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        docCard.style.outline = '4px solid #3b82f6';
        setTimeout(() => {
            docCard.style.outline = 'none';
        }, 1500);
    });
});
