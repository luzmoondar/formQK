document.addEventListener('DOMContentLoaded', () => {
    // 1. Set Current Date
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;
    }

    // 2. Photo Upload & Preview Logic (Restored)
    const photoInput = document.getElementById('photo-input');
    const previewGrid = document.getElementById('photo-preview-box');
    const previewPlaceholder = document.getElementById('preview-placeholder');
    let allSelectedFiles = []; 

    function renderPreviews() {
        if (!previewGrid) return;
        Array.from(previewGrid.children).forEach(child => {
            if (child.id !== 'preview-placeholder') previewGrid.removeChild(child);
        });

        if (allSelectedFiles.length === 0) {
            if (previewPlaceholder) previewPlaceholder.style.display = 'flex';
        } else {
            if (previewPlaceholder) previewPlaceholder.style.display = 'none';
            allSelectedFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const wrap = document.createElement('div');
                    wrap.className = 'preview-img-wrap';
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    wrap.appendChild(img);
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-photo-btn';
                    removeBtn.innerHTML = '&times;';
                    removeBtn.type = 'button';
                    removeBtn.onclick = (e) => {
                        e.stopPropagation();
                        allSelectedFiles.splice(index, 1);
                        updateInputFiles();
                        renderPreviews();
                    };
                    wrap.appendChild(removeBtn);
                    previewGrid.appendChild(wrap);
                };
                reader.readAsDataURL(file);
            });
        }
    }

    function updateInputFiles() {
        const dataTransfer = new DataTransfer();
        allSelectedFiles.forEach(file => dataTransfer.items.add(file));
        if (photoInput) photoInput.files = dataTransfer.files;
    }

    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const newFiles = Array.from(e.target.files);
            const combined = [...allSelectedFiles, ...newFiles];
            if (combined.length > 5) {
                alert('최대 5장까지만 업로드 가능합니다.');
                allSelectedFiles = combined.slice(0, 5);
            } else {
                allSelectedFiles = combined;
            }
            updateInputFiles();
            renderPreviews();
        });
    }

    // 3. Mini Preview Logic (Logo, QR)
    function handleMiniPreview(inputSelector, previewBoxId) {
        const input = document.getElementById(inputSelector);
        const box = document.getElementById(previewBoxId);
        if (!input || !box) return;
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            box.innerHTML = '';
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    const img = document.createElement('img');
                    img.src = event.target.result;
                    box.appendChild(img);
                };
                reader.readAsDataURL(file);
            } else {
                const ext = file.name.split('.').pop().toUpperCase();
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

    if (window.lucide) lucide.createIcons();

    // 4. Character Counter & Auto-Expand
    const textareas = document.querySelectorAll('#vendor-form textarea[maxlength]');
    textareas.forEach(textarea => {
        const mirrorId = `mirror-${textarea.name}`;
        const mirrorEl = document.getElementById(mirrorId);
        const autoExpand = () => {
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';
            if (mirrorEl) mirrorEl.textContent = textarea.value;
        };
        textarea.addEventListener('input', () => {
            const currentLength = textarea.value.length;
            const maxLength = textarea.getAttribute('maxlength');
            const counterElement = document.getElementById(`count-${textarea.name}`);
            if (counterElement) {
                counterElement.textContent = `${currentLength.toLocaleString()} / ${parseInt(maxLength).toLocaleString()}`;
                counterElement.style.color = currentLength >= maxLength * 0.9 ? '#e53e3e' : '#94a3b8';
            }
            autoExpand();
        });
        autoExpand();
    });

    // 5. Final ZIP Submission (PDF + Original Media)
    const form = document.getElementById('vendor-form');
    const saveSendBtn = document.getElementById('save-send-btn');
    const docCard = document.getElementById('intro-document');
    const successOverlay = document.getElementById('success-overlay');

    if (saveSendBtn) {
        saveSendBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            // Validation: Company Name
            const formData = new FormData(form);
            const companyName = (formData.get('company_name_kor') || formData.get('company_name_eng') || '').trim();
            if (!companyName) {
                alert('저장을 위해 업체명(국문 또는 영문)을 반드시 입력해 주세요.');
                return;
            }

            const btnText = saveSendBtn.querySelector('.btn-text');
            const btnLoading = saveSendBtn.querySelector('.btn-loading');
            saveSendBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline';

            const safeName = companyName.replace(/[/\\?%*:|"<>]/g, '-');

            try {
                // A. Generate High-Quality PDF (Image-based for Zip storage)
                const opt = {
                    margin: 10,
                    filename: `${safeName}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true, logging: false },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                };
                const pdfBlob = await html2pdf().from(docCard).set(opt).output('blob');

                // B. Create ZIP Package
                const zip = new JSZip();
                const root = zip.folder(`${safeName}_Package`);
                
                root.file(`${safeName}_Information.pdf`, pdfBlob);
                root.file("README_INFO.txt", `Exhibitor: ${companyName}\nDate: ${new Date().toLocaleString()}\n\nNote: All original assets included in subfolders.`);

                // Add Original Photos
                if (allSelectedFiles.length > 0) {
                    const imgFolder = root.folder("img");
                    allSelectedFiles.forEach((file, index) => {
                        const ext = file.name.split('.').pop();
                        imgFolder.file(`Photo_${index + 1}.${ext}`, file);
                    });
                }

                // Add Original Logo/QR
                const brandingFolder = root.folder("Branding_Assets");
                const logoFile = document.getElementById('logo-input').files[0];
                const qrFile = document.getElementById('qr-input').files[0];
                if (logoFile) brandingFolder.file(`Original_Logo.${logoFile.name.split('.').pop()}`, logoFile);
                if (qrFile) brandingFolder.file(`Original_QR.${qrFile.name.split('.').pop()}`, qrFile);

                // C. Final Download
                const zipContent = await zip.generateAsync({ type: "blob" });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipContent);
                link.download = `${safeName}_Package.zip`;
                link.click();

                // Success Modal
                setTimeout(() => {
                    if (successOverlay) successOverlay.style.display = 'flex';
                    saveSendBtn.disabled = false;
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoading) btnLoading.style.display = 'none';
                }, 1000);

            } catch (error) {
                console.error('Packaging Error:', error);
                alert('파일 압축 중 오류가 발생했습니다.');
                saveSendBtn.disabled = false;
                if (btnText) btnText.style.display = 'inline';
                if (btnLoading) btnLoading.style.display = 'none';
            }
        });
    }
});
