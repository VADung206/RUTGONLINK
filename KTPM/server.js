const express = require('express');
const lib = require('./utils');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const NodeCache = require('node-cache'); // Thêm thư viện cache

const app = express();
const port = 3001;

// 1. Cấu hình Cache
const cache = new NodeCache({
  stdTTL: 86400, // Cache 1 ngày
  checkperiod: 600, // Tự động dọn cache mỗi 10 phút
  maxKeys: 100000 // Giới hạn 100,000 URL
});

// 2. Middleware
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// 3. Rate Limiting
const createShortUrlLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Quá nhiều yêu cầu tạo link từ IP này, vui lòng thử lại sau 15 phút',
});

app.use(express.static(path.join(__dirname, 'public')));

// 4. Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 4.1. Endpoint Redirect với Cache-Aside
app.get('/short/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // Kiểm tra cache trước
    const cachedUrl = cache.get(id);
    if (cachedUrl) {
      console.log(`[Cache] Hit for ${id}`);
      return res.redirect(cachedUrl);
    }

    // Cache miss: truy vấn database
    const url = await lib.findOrigin(id);
    if (!url) {
      return res.status(404).send("<h1>404 Not Found</h1>");
    }

    // Lưu vào cache
    cache.set(id, url);
    console.log(`[Cache] Miss - Saved ${id} to cache`);
    res.redirect(url);
  } catch (err) {
    console.error('Redirect error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// 4.2. Endpoint Create với Rate Limiting và Cache Warming
app.post('/create', 
  (req, res, next) => {
    if (!req.query.url) {
      return res.status(400).send('URL parameter is required');
    }
    next();
  },
  createShortUrlLimiter,
  async (req, res) => {
    try {
      const url = req.query.url;
      const newID = await lib.shortUrl(url);

      // Lưu vào cache ngay khi tạo thành công
      cache.set(newID, url);
      console.log(`[Cache] Pre-cached ${newID}`);

      // Chỉ trả về ID thôi
      res.send(newID);
    } catch (err) {
      console.error('Create error:', err);
      res.status(500).send('Failed to create short URL');
    }
  }
);

// 5. Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 6. Khởi động server
app.listen(port, () => {
  console.log(`
  Ứng dụng đang chạy tại: http://localhost:${port}
  Endpoints:
    - GET  /short/:id    - Redirect
    - POST /create?url=  - Tạo short URL (rate limited)
  `);
});