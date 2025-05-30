// Gerekli modülleri dahil ediyoruz
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// Express uygulamasını başlatıyoruz
const app = express();

// Render otomatik PORT verir ama yerelde 3001 de çalıştırabiliriz
const port = process.env.PORT || 3001;

// CORS politikasını aktif ediyoruz (React vs. frontend'den erişim için)
app.use(cors());

// === KÖK SAYFA: http://localhost:3001 veya https://xxx.onrender.com ===
app.get('/', (req, res) => {
    res.send(`
        <h1>Proxy Sunucusu Çalışıyor ✅</h1>
        <p>Bu bir Node.js proxy sunucusudur.</p>
        <p><strong>Kullanım:</strong> <code>/proxy-google</code> yoluna istek gönderin.</p>
        <p>Örnek: <a href="/proxy-google">/proxy-google</a></p>
    `);
});

// === PROXY GOOGLE: /proxy-google ===
app.get('/proxy-google', async (req, res) => {
    const googleUrl = 'https://example.com';  
    try {
        const response = await axios.get(googleUrl, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0'
            }
        });

        // Google'dan gelen tüm başlıkları ileriye ilet (özellikle Content-Type önemli)
        Object.keys(response.headers).forEach(key => {
            res.setHeader(key, response.headers[key]);
        });

        // Google'ın HTML içeriğini doğrudan kullanıcıya gönder
        res.send(response.data);

    } catch (error) {
        console.error('Proxy hatası:', error.message);
        res.status(500).send(`Google.com'u çekerken hata oluştu: ${error.message}`);
    }
}); 

// === SUNUCUYU BAŞLAT ===
app.listen(port, () => {
    console.log(`Node.js Proxy Sunucusu http://localhost:${port} adresinde çalışıyor.`);
});
