document.addEventListener('DOMContentLoaded', () => {
    // 1. Set Current Date
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;
    }

    // 2. Photo Upload & Preview Logic
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
        photoInput.addEventListener('change', (e) => {
            const combined = [...allSelectedFiles, ...Array.from(e.target.files)];
            allSelectedFiles = combined.slice(0, 5);
            updateInputFiles();
            renderPreviews();
        });
    }

    // 3. Robust Logo Preview Logic (Improved for AI/EPS/PDF + Name + Delete)
    function handleMiniPreview(inputSelector, previewBoxId) {
        const input = document.getElementById(inputSelector);
        const box = document.getElementById(previewBoxId);
        if (!input || !box) return;
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            box.innerHTML = ''; // Clear placeholder
            const infoBox = document.getElementById(inputSelector.replace('-input', '-file-info'));
            if (infoBox) infoBox.innerHTML = '';
            
            const fileName = file.name;
            const extension = fileName.split('.').pop().toUpperCase();
            const isImage = /\.(JPG|JPEG|PNG|GIF|SVG|WEBP)$/i.test(fileName);

            if (isImage) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const img = document.createElement('img');
                    img.src = ev.target.result;
                    box.appendChild(img);
                };
                reader.readAsDataURL(file);
            } else {
                const extSpan = document.createElement('span');
                extSpan.className = 'ext-badge';
                extSpan.textContent = extension;
                box.appendChild(extSpan);
            }

            if (infoBox) {
                const nameSpan = document.createElement('span');
                nameSpan.className = 'file-name-text';
                nameSpan.textContent = fileName;
                
                const rmBtn = document.createElement('button');
                rmBtn.className = 'text-remove-btn';
                rmBtn.innerHTML = '삭제';
                rmBtn.onclick = (ev) => {
                    ev.preventDefault();
                    input.value = ""; // Clear input
                    box.innerHTML = '<span class="placeholder-text">Logo</span>';
                    infoBox.innerHTML = '';
                };
                
                infoBox.appendChild(nameSpan);
                infoBox.appendChild(rmBtn);
            }
        });
    }
    handleMiniPreview('logo-input', 'logo-preview-box');

    if (window.lucide) lucide.createIcons();

    // 4. Character Counter & Mirror (Auto-Expand)
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
            const countEl = document.getElementById(`count-${textarea.name}`);
            if (countEl) countEl.textContent = `${textarea.value.length.toLocaleString()} / ${textarea.getAttribute('maxlength').toLocaleString()}`;
            autoExpand();
        });
        autoExpand();
    });

    // 5. Final HTML ZIP Submission
    const form = document.getElementById('vendor-form');
    const saveSendBtn = document.getElementById('save-send-btn');
    const docCard = document.getElementById('intro-document');
    const successOverlay = document.getElementById('success-overlay');

    if (saveSendBtn) {
        saveSendBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const companyName = (formData.get('company_name_kor') || formData.get('company_name_eng') || '').trim();
            if (!companyName) return alert('업체명을 입력해 주세요.');

            const btnText = saveSendBtn.querySelector('.btn-text');
            const btnLoading = saveSendBtn.querySelector('.btn-loading');
            saveSendBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnLoading) btnLoading.style.display = 'inline';

            const safeName = companyName.replace(/[/\\?%*:|"<>]/g, '-');

            try {
                const clone = docCard.cloneNode(true);
                const originalInputs = docCard.querySelectorAll('input, textarea');
                clone.querySelectorAll('input, textarea').forEach((el, i) => {
                    if (originalInputs[i]) {
                        if (el.tagName === 'TEXTAREA') el.textContent = originalInputs[i].value;
                        else el.setAttribute('value', originalInputs[i].value);
                        el.setAttribute('readonly', 'readonly');
                    }
                });

                clone.querySelectorAll('.no-print-input, .remove-photo-btn, .file-label, .mini-file-label, .char-counter-wrap, .btn-primary, .btn-secondary, .mini-remove-btn').forEach(el => el.remove());
                
                const logoImg = clone.querySelector('#logo-preview-box img');
                const photoImgs = clone.querySelectorAll('#photo-preview-box img');
                const logoFile = document.getElementById('logo-input').files[0];

                if (logoImg && logoFile) logoImg.src = `Branding_Assets/Logo.${logoFile.name.split('.').pop()}`;
                photoImgs.forEach((img, i) => { if (allSelectedFiles[i]) img.src = `img/Photo_${i+1}.${allSelectedFiles[i].name.split('.').pop()}`; });

                const cssText = Array.from(document.styleSheets)
                    .filter(sheet => !sheet.href || sheet.href.includes(window.location.hostname))
                    .map(sheet => {
                        try { return Array.from(sheet.cssRules).map(r => r.cssText).join('\n'); }
                        catch(e) { return ''; }
                    }).join('\n');

                const archiveHtml = `
                <!DOCTYPE html>
                <html lang="ko">
                <head>
                    <meta charset="UTF-8"><title>${companyName} - Archive</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
                    <style>
                        body { background: #f0f2f5; margin: 0; padding: 40px; font-family: 'Inter', sans-serif; }
                        ${cssText}
                        .form-document-card { margin: 0 auto; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); width: 100%; max-width: 900px; border: 1px solid #e2e8f0; }
                        input, textarea { border: none !important; background: transparent !important; resize: none; outline: none; }
                        input:focus, textarea:focus { border: none !important; box-shadow: none !important; background: transparent !important; }
                        .preview-img-wrap { border: none !important; box-shadow: none !important; }
                    </style>
                </head>
                <body><div class="container">${clone.outerHTML}</div></body>
                </html>`;

                const zip = new JSZip();
                const root = zip.folder(`${safeName}_Package`);
                root.file(`${safeName}_Archive.html`, archiveHtml);
                
                if (allSelectedFiles.length > 0) {
                    const imgFolder = root.folder("img");
                    allSelectedFiles.forEach((f, i) => imgFolder.file(`Photo_${i+1}.${f.name.split('.').pop()}`, f));
                }
                const brandingFolder = root.folder("Branding_Assets");
                if (logoFile) brandingFolder.file(`Logo.${logoFile.name.split('.').pop()}`, logoFile);

                const content = await zip.generateAsync({ type: "blob" });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = `${safeName}_Package.zip`;
                link.click();

                setTimeout(() => {
                    if (successOverlay) successOverlay.style.display = 'flex';
                    saveSendBtn.disabled = false;
                    if (btnText) btnText.style.display = 'inline';
                    if (btnLoading) btnLoading.style.display = 'none';
                }, 1000);
            } catch (err) {
                console.error(err);
                alert('에러 발생!');
                saveSendBtn.disabled = false;
                if (btnText) btnText.style.display = 'inline';
                if (btnLoading) btnLoading.style.display = 'none';
            }
        });
    }
});
