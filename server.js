// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

app.get('/proxy-google', async (req, res) => {
    const googleUrl = 'https://www.google.com';
    try {
        const response = await axios.get(googleUrl, {
            headers: {
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0'
            }
        });

        Object.keys(response.headers).forEach(key => {
            res.setHeader(key, response.headers[key]);
        });

        res.send(response.data);

    } catch (error) {
        console.error('Proxy hatası:', error.message);
        res.status(500).send(`Google.com'u çekerken hata oluştu: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log(`Node.js Proxy Sunucusu http://localhost:${port} adresinde çalışıyor.`);
});
