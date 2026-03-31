document.addEventListener('DOMContentLoaded', () => {
    // 1. Set Current Date
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const now = new Date();
        dateEl.textContent = `${now.getFullYear()}. ${String(now.getMonth() + 1).padStart(2, '0')}. ${String(now.getDate()).padStart(2, '0')}`;
    }

    // 2. Photo Preview Logic (Supports Cumulative Upload & Individual Deletion)
    const photoInput = document.getElementById('photo-input');
    const previewGrid = document.getElementById('photo-preview-box');
    const previewPlaceholder = document.getElementById('preview-placeholder');
    let allSelectedFiles = []; // Persistent array to track all photos

    function renderPreviews() {
        // Clear all except placeholder
        Array.from(previewGrid.children).forEach(child => {
            if (child.id !== 'preview-placeholder') previewGrid.removeChild(child);
        });

        if (allSelectedFiles.length === 0) {
            previewPlaceholder.style.display = 'flex';
        } else {
            previewPlaceholder.style.display = 'none';
            
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
                        allSelectedFiles.splice(index, 1); // Remove from array
                        updateInputFiles(); // Sync back to input.files
                        renderPreviews(); // Re-draw
                    };
                    wrap.appendChild(removeBtn);
                    previewGrid.appendChild(wrap);
                };
                reader.readAsDataURL(file);
            });
        }
    }

    // Crucial: This syncs our internal array back to the actual input files
    function updateInputFiles() {
        const dataTransfer = new DataTransfer();
        allSelectedFiles.forEach(file => dataTransfer.items.add(file));
        photoInput.files = dataTransfer.files;
    }

    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const newFiles = Array.from(e.target.files);
            
            // Append new files to existing ones
            const combined = [...allSelectedFiles, ...newFiles];
            
            if (combined.length > 5) {
                alert('최대 5장까지만 업로드 가능합니다.\n(Only up to 5 photos can be uploaded.)');
                allSelectedFiles = combined.slice(0, 5);
            } else {
                allSelectedFiles = combined;
            }

            updateInputFiles();
            renderPreviews();
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

    // 5. Real-time Character Counter
    const textareas = document.querySelectorAll('#vendor-form textarea[maxlength]');
    textareas.forEach(textarea => {
        textarea.addEventListener('input', () => {
            const currentLength = textarea.value.length;
            const maxLength = textarea.getAttribute('maxlength');
            const counterId = `count-${textarea.name}`;
            const counterElement = document.getElementById(counterId);
            if (counterElement) {
                counterElement.textContent = `${currentLength.toLocaleString()} / ${parseInt(maxLength).toLocaleString()}`;
                
                // Visual feedback when close to limit
                if (currentLength >= maxLength * 0.9) {
                    counterElement.style.color = '#e53e3e'; // Warning red
                } else {
                    counterElement.style.color = '#94a3b8';
                }
            }
        });
    });

    // 6. Preview Logic

    // 5. Preview Logic
    if (previewBtn) {
        previewBtn.addEventListener('click', function() {
            const formCard = docCard.cloneNode(true);
            
            // Remove interactive parts from preview
            formCard.querySelectorAll('.no-print-input, .mini-file-label, .file-label').forEach(el => el.remove());
            
            // Collect styles
            const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
                .map(s => s.outerHTML)
                .join('');

            const previewWindow = window.open('', '_blank');
            previewWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>미리보기 - 퀀텀 코리아 2026</title>
                    ${styles}
                    <style>
                        body { background: #f4f7f6; padding: 40px 0; }
                        .form-document-card { margin: 0 auto; box-shadow: none; border: 1px solid #eee; }
                        input, textarea { border: none !important; background: transparent !important; padding: 0 !important; cursor: default; }
                        .mini-upload-area { border: none !important; background: transparent !important; padding: 0 !important; }
                        .mini-preview-box { border: 1px solid #f0f0f0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        ${formCard.outerHTML}
                    </div>
                </body>
                </html>
            `);

            previewWindow.document.close();

            // Sync current values and images to the new window
            setTimeout(() => {
                const originalInputs = document.querySelectorAll('#vendor-form input, #vendor-form textarea');
                const previewInputs = previewWindow.document.querySelectorAll('input, textarea');
                originalInputs.forEach((input, index) => {
                    if (previewInputs[index]) {
                        previewInputs[index].value = input.value;
                        previewInputs[index].readOnly = true;
                    }
                });
                
                // Copy photo previews
                const originalPhotoGrid = document.getElementById('photo-preview-box').innerHTML;
                const previewPhotoBox = previewWindow.document.getElementById('photo-preview-box');
                if (previewPhotoBox) {
                    previewPhotoBox.innerHTML = originalPhotoGrid;
                    previewPhotoBox.querySelectorAll('.remove-photo-btn').forEach(btn => btn.remove());
                    previewPhotoBox.style.border = 'none';
                    previewPhotoBox.style.background = 'transparent';
                    previewPhotoBox.style.padding = '0';
                }

                // Copy Logo/QR previews
                ['logo', 'qr'].forEach(type => {
                    const originalBox = document.getElementById(`${type}-preview-box`).innerHTML;
                    const previewBox = previewWindow.document.getElementById(`${type}-preview-box`);
                    if (previewBox) { previewBox.innerHTML = originalBox; }
                });
            }, 100);
        });
    }

    // 5. PDF Generation Options (Configured for High Quality & Text Searchability)
    const opt = {
        margin: [10, 10, 10, 10],
        filename: 'Exhibitor_Information.pdf',
        image: { type: 'jpeg', quality: 1.0 }, // Max quality
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            letterRendering: true // Helps with text quality
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
        pagebreak: { mode: 'avoid-all', before: '.form-section' }
    };

    // 6. Save & ZIP Logic (PDF + Original Images)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI state: loading
        const btnText = saveSendBtn.querySelector('.btn-text');
        const btnLoading = saveSendBtn.querySelector('.btn-loading');
        const companyName = form.company_name_kor.value.trim() || 'Exhibitor';
        const safeName = companyName.replace(/[/\\?%*:|"<>]/g, '-'); // Sanitize filename
        
        saveSendBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';

        try {
            const zip = new JSZip();
            const rootFolder = zip.folder(`${safeName}_Package`);

            // A. Generate PDF Blob
            // Set output to 'blob' instead of immediate '.save()'
            const pdfBlob = await html2pdf().from(docCard).set(opt).output('blob');
            rootFolder.file(`${safeName}_Form.pdf`, pdfBlob);

            // B. Add Original Photos
            if (allSelectedFiles.length > 0) {
                const photoFolder = rootFolder.folder("Original_Photos");
                allSelectedFiles.forEach((file, index) => {
                    const ext = file.name.split('.').pop();
                    photoFolder.file(`Photo_${index + 1}.${ext}`, file);
                });
            }

            // C. Add Logo & QR
            const identityFolder = rootFolder.folder("Original_Logo_QR");
            const logoFile = document.getElementById('logo-input').files[0];
            const qrFile = document.getElementById('qr-input').files[0];

            if (logoFile) {
                const ext = logoFile.name.split('.').pop();
                identityFolder.file(`Company_Logo.${ext}`, logoFile);
            }
            if (qrFile) {
                const ext = qrFile.name.split('.').pop();
                identityFolder.file(`Company_QR.${ext}`, qrFile);
            }

            // D. Generate and Download ZIP
            const content = await zip.generateAsync({ type: "blob" });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `${safeName}_zip.zip`; // Simplified as requested
            link.click();

            // Success feedback
            setTimeout(() => {
                successOverlay.style.display = 'flex';
                saveSendBtn.disabled = false;
                btnText.style.display = 'inline';
                btnLoading.style.display = 'none';
            }, 1000);

        } catch (error) {
            console.error('Packaging failed:', error);
            alert('파일 압축 중 오류가 발생했습니다. (Error during packaging)');
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
