// DOM elementlerini seçiyoruz
const uploadForm = document.getElementById('uploadForm');
const imageInput = document.getElementById('imageInput');
const fileNameSpan = document.getElementById('fileName');
const uploadButton = document.getElementById('uploadButton');
const loadingDiv = document.getElementById('loading');
const resultDiv = document.getElementById('result');
const svgPreview = document.getElementById('svgPreview');
const noPreviewText = document.getElementById('noPreviewText');
const downloadLink = document.getElementById('downloadLink');
const errorMessageDiv = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Hata mesajını göstermek için yardımcı fonksiyon
function showErrorMessage(message) {
    errorMessageDiv.classList.remove('hidden');
    errorText.textContent = message;
    resultDiv.classList.add('hidden'); // Sonuç alanını gizle
}

// Hata mesajını gizlemek için yardımcı fonksiyon
function hideErrorMessage() {
    errorMessageDiv.classList.add('hidden');
    errorText.textContent = '';
}

// Dosya seçildiğinde dosya adını göster
imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        fileNameSpan.textContent = `(${file.name})`;
        hideErrorMessage(); // Yeni dosya seçildiğinde önceki hatayı temizle
        resultDiv.classList.add('hidden'); // Yeni dosya seçildiğinde önceki sonucu gizle
        svgPreview.classList.add('hidden');
        noPreviewText.classList.remove('hidden');
        downloadLink.classList.add('hidden');
    } else {
        fileNameSpan.textContent = '';
    }
});

// Form gönderildiğinde
uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Formun varsayılan gönderimini engelle

    hideErrorMessage(); // Önceki hataları temizle
    resultDiv.classList.add('hidden'); // Önceki sonuçları gizle
    svgPreview.classList.add('hidden');
    noPreviewText.classList.remove('hidden');
    downloadLink.classList.add('hidden');

    const file = imageInput.files[0]; // Seçilen dosyayı al

    // Dosya seçilmemişse hata göster
    if (!file) {
        showErrorMessage('Lütfen vektörleştirmek için bir resim dosyası seçin.');
        return;
    }

    // Yükleme butonunu devre dışı bırak ve yükleniyor animasyonunu göster
    uploadButton.disabled = true;
    loadingDiv.classList.remove('hidden');

    const formData = new FormData(); // FormData nesnesi oluştur
    formData.append('image', file); // Resim dosyasını 'image' adıyla ekle

    try {
        // Arka uca fetch isteği gönder
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData, // FormData'yı doğrudan body olarak gönder
        });

        const data = await response.json(); // Yanıtı JSON olarak ayrıştır

        if (response.ok && data.success) {
            // Başarılı olursa sonuçları göster
            resultDiv.classList.remove('hidden');
            svgPreview.src = data.svgUrl; // SVG önizlemesini ayarla
            svgPreview.classList.remove('hidden');
            noPreviewText.classList.add('hidden');
            downloadLink.href = data.svgUrl; // İndirme bağlantısını ayarla
            downloadLink.download = `vectorized_image_${Date.now()}.svg`; // İndirme dosya adını ayarla
            downloadLink.classList.remove('hidden');
        } else {
            // Hata olursa mesajı göster
            showErrorMessage(data.message || 'Bilinmeyen bir hata oluştu.');
        }
    } catch (error) {
        console.error('İstek hatası:', error);
        showErrorMessage('Sunucuya bağlanırken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
        // Yükleme tamamlandığında butonu tekrar etkinleştir ve yükleniyor animasyonunu gizle
        uploadButton.disabled = false;
        loadingDiv.classList.add('hidden');
    }
});
