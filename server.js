// Gerekli modülleri içe aktarıyoruz
const express = require('express'); // Web sunucusu için Express
const multer = require('multer');   // Dosya yüklemelerini işlemek için Multer
const { vectorize, ColorMode, Hierarchical, PathSimplifyMode } = require('@neplex/vectorizer'); // Vektörleştirme kütüphanesi
const fs = require('fs').promises; // Dosya sistemi işlemleri için Node.js'in fs modülü (Promise tabanlı)
const path = require('path');     // Dosya yollarıyla çalışmak için Node.js'in path modülü

const app = express(); // Express uygulamasını başlatıyoruz
const PORT = process.env.PORT || 3000; // Sunucunun çalışacağı portu belirliyoruz, Render için process.env.PORT önemlidir

// Geçici dosya depolama dizinlerini oluşturuyoruz
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const VECTORIZED_DIR = path.join(__dirname, 'vectorized');

// Dizinler yoksa oluştur
async function createDirs() {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        await fs.mkdir(VECTORIZED_DIR, { recursive: true });
        console.log('Geçici dizinler oluşturuldu.');
    } catch (error) {
        console.error('Dizin oluşturma hatası:', error);
    }
}
createDirs();

// Multer depolama yapılandırması: Yüklenen dosyaları 'uploads' klasörüne kaydet
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR); // Dosyaların yükleneceği dizin
    },
    filename: function (req, file, cb) {
        // Dosya adını benzersiz hale getiriyoruz (orijinal ad + timestamp + uzantı)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// Multer yükleme middleware'i: Tek bir 'image' alanından dosya kabul et
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB dosya boyutu limiti
    fileFilter: (req, file, cb) => {
        // Sadece belirli resim türlerine izin ver
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Sadece JPEG, PNG, WEBP, BMP ve GIF resim dosyaları yüklenebilir.'), false);
        }
    }
});

// Express uygulaması için statik dosya sunumu yapılandırması
// 'public' klasöründeki dosyalar doğrudan erişilebilir olacak (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Vektörleştirilmiş dosyaların sunulacağı dizin
app.use('/vectorized', express.static(VECTORIZED_DIR));

// Resim yükleme ve vektörleştirme için POST endpoint'i
app.post('/upload', upload.single('image'), async (req, res) => {
    // Yüklenen dosya yoksa hata döndür
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Lütfen bir resim dosyası seçin.' });
    }

    const uploadedFilePath = req.file.path; // Yüklenen dosyanın tam yolu
    const outputFileName = `${path.parse(req.file.filename).name}.svg`; // Çıktı SVG dosyasının adı
    const vectorizedFilePath = path.join(VECTORIZED_DIR, outputFileName); // Vektörleştirilmiş dosyanın kaydedileceği yol

    try {
        // Yüklenen resim dosyasını oku
        const imageBuffer = await fs.readFile(uploadedFilePath);

        // Resim buffer'ını vektörleştir
        const svgString = await vectorize(imageBuffer, { 
            colorMode: ColorMode.Color, // Renkli vektörleştirme
            colorPrecision: 8,          // Renk hassasiyeti
            filterSpeckle: 4,           // Benekleri filtreleme
            spliceThreshold: 45,        // Birleştirme eşiği
            cornerThreshold: 60,        // Köşe eşiği
            hierarchical: Hierarchical.Stacked, // Katmanlama stratejisi
            mode: PathSimplifyMode.Spline, // Yol basitleştirme modu
            layerDifference: 6,         // Katman farkı
            lengthThreshold: 4,         // Uzunluk eşiği
            maxIterations: 2            // Maksimum iterasyon sayısı
        });

        // Vektörleştirilmiş SVG'yi dosyaya yaz
        await fs.writeFile(vectorizedFilePath, svgString);

        // Başarılı yanıt gönder ve vektörleştirilmiş dosyanın URL'sini sağla
        res.json({ 
            success: true, 
            message: 'Resim başarıyla vektörleştirildi!', 
            svgUrl: `/vectorized/${outputFileName}` // Frontend'in erişebileceği URL
        });

    } catch (error) {
        console.error('Vektörleştirme veya dosya işlemi hatası:', error);
        res.status(500).json({ success: false, message: 'Resim vektörleştirilirken bir hata oluştu.', error: error.message });
    } finally {
        // Geçici yüklenen dosyayı temizle
        try {
            await fs.unlink(uploadedFilePath);
            console.log(`Geçici dosya silindi: ${uploadedFilePath}`);
        } catch (unlinkError) {
            console.error(`Geçici dosya silinirken hata oluştu: ${uploadedFilePath}`, unlinkError);
        }
    }
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});
