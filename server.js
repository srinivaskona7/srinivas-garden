require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const marked = require('marked');

const app = express();
const PORT = process.env.PORT || 3000;

// Use in-memory database with JSON persistence
console.log('🧠 Running in IN-MEMORY mode (with JSON persistence!)');
const { initializeDatabase, Layout, Plant } = require('./config/memoryDb');
initializeDatabase();

// Routes
const authRoutes = require('./routes/auth');
const layoutRoutes = require('./routes/layouts');
const plantRoutes = require('./routes/plants-memory');
const gardenRoutes = require('./routes/gardens-memory');
const healthRoutes = require('./routes/health');
const uploadRoutes = require('./routes/upload');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/layouts', layoutRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/gardens', gardenRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/health', healthRoutes);

// System Routes
app.get('/api/system/disk', (req, res) => {
  const fs = require('fs');
  const uploadDir = path.join(__dirname, 'public/uploads');
  // Ensure we check the volume where uploads actually happen
  fs.statfs(uploadDir, (err, stats) => {
    if (err) {
      // Fallback to root if public/uploads doesn't exist or errors
      fs.statfs('.', (err2, stats2) => {
        if (err2) return res.json({ free: 0, total: 0 });
        res.json({ free: stats2.bfree * stats2.bsize, total: stats2.blocks * stats2.bsize });
      });
      return;
    }
    res.json({ free: stats.bfree * stats.bsize, total: stats.blocks * stats.bsize });
  });
});

// Frontend routes
app.get('/', async (req, res) => {
  try {
    let plants = await (await Plant.find({})).sort('-createdAt').limit(20).skip(0);

    // Ensure plants is always a plain array for JSON serialization
    if (!Array.isArray(plants)) {
      console.warn('Warning: plants is not an array, got:', typeof plants);
      plants = [];
    }

    // Sanitize plants to ensure they're plain objects (remove methods like .save)
    plants = plants.map(p => ({
      _id: p._id,
      name: p.name,
      species: p.species,
      description: p.description,
      category: p.category,
      isPriority: p.isPriority,
      wateringFrequency: p.wateringFrequency,
      sunlight: p.sunlight,
      location: p.location,
      healthStatus: p.healthStatus,
      careNotes: p.careNotes,
      currentVersion: p.currentVersion,
      versions: p.versions,
      plantedDate: p.plantedDate,
      expectedHarvestDate: p.expectedHarvestDate,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    console.log(`📄 Rendering index with ${plants.length} plants`);

    res.render('index', {
      title: "Sri's Garden",
      plants
    });
  } catch (error) {
    console.error('Error loading homepage:', error);
    res.render('index', {
      title: "Sri's Garden", plants: []
    });
  }
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

app.get('/admin', (req, res) => {
  res.render('admin', { title: 'Admin Dashboard' });
});

app.get('/plants', async (req, res) => {
  try {
    const plants = await (await Plant.find({})).sort('-createdAt').limit(100).skip(0);
    res.render('plants', { title: 'My Plants', plants });
  } catch (error) {
    console.error('Error fetching plants:', error);
    res.render('plants', { title: 'My Plants', plants: [] });
  }
});

app.get('/garden', async (req, res) => {
  try {
    const memDb = require('./config/memoryDb');
    const gardens = await (await memDb.Garden.find({})).populate('plants').sort('-createdAt').limit(100).skip(0);
    const plants = await (await memDb.Plant.find({})).sort('name').limit(100).skip(0);
    res.render('garden', { title: 'My Gardens', gardens, plants });
  } catch (error) {
    console.error('Error fetching gardens:', error);
    res.render('garden', { title: 'My Gardens', gardens: [], plants: [] });
  }
});

app.get('/changelog', (req, res) => {
  try {
    const changelogPath = path.join(__dirname, 'CHANGELOG.md');
    // Check if file exists to avoid crash
    if (!fs.existsSync(changelogPath)) {
      return res.render('changelog', { title: "Changelog", content: "<p>Changelog not found.</p>" });
    }
    const changelogContent = fs.readFileSync(changelogPath, 'utf8');
    const htmlContent = marked.parse(changelogContent);
    res.render('changelog', { title: "Changelog", content: htmlContent });
  } catch (error) {
    console.error('Error serving changelog:', error);
    res.render('changelog', { title: "Changelog", content: "<p>Error loading changelog.</p>" });
  }
});

// Status page - displays quote API status
app.get('/status', (req, res) => {
  res.render('status', { title: 'API Status' });
});

// Advice API proxy - to avoid CORS issues with adviceslip.com
app.get('/api/quote', async (req, res) => {
  try {
    const https = require('https');

    const fetchAdvice = () => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.adviceslip.com',
          port: 443,
          path: '/advice',
          method: 'GET',
          timeout: 5000
        };

        const request = https.request(options, (response) => {
          let data = '';
          response.on('data', chunk => data += chunk);
          response.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              // Transform to match expected format: { advice: "...", id: ... }
              resolve({
                advice: parsed.slip?.advice || 'No advice available',
                id: parsed.slip?.id || null
              });
            } catch (e) {
              reject(new Error('Failed to parse response'));
            }
          });
        });

        request.on('error', reject);
        request.on('timeout', () => {
          request.destroy();
          reject(new Error('Request timeout'));
        });

        request.end();
      });
    };

    const advice = await fetchAdvice();
    res.json(advice);

  } catch (error) {
    console.error('Advice API error:', error.message);
    res.status(503).json({
      error: error.message || 'Network error - API not reachable',
      advice: null,
      id: null
    });
  }
});

// ZenQuotes API proxy - allowed by egress policy
app.get('/api/zenquote', async (req, res) => {
  try {
    const https = require('https');

    const fetchZenQuote = () => {
      return new Promise((resolve, reject) => {
        const options = {
          hostname: 'zenquotes.io',
          port: 443,
          path: '/api/random',
          method: 'GET',
          timeout: 5000
        };

        const request = https.request(options, (response) => {
          let data = '';
          response.on('data', chunk => data += chunk);
          response.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              // ZenQuotes returns array: [{ q: "quote", a: "author" }]
              resolve({
                quote: parsed[0]?.q || 'No quote available',
                author: parsed[0]?.a || 'Unknown'
              });
            } catch (e) {
              reject(new Error('Failed to parse response'));
            }
          });
        });

        request.on('error', reject);
        request.on('timeout', () => {
          request.destroy();
          reject(new Error('Request timeout'));
        });

        request.end();
      });
    };

    const quote = await fetchZenQuote();
    res.json(quote);

  } catch (error) {
    console.error('ZenQuotes API error:', error.message);
    res.status(503).json({
      error: error.message || 'Network error - API not reachable',
      quote: null,
      author: null
    });
  }
});


// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server only if this file is run directly (not imported for tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log("║         🌿 Sri's Garden App is Running! 🌿             ║");
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`   🌐 Open http://localhost:${PORT} in your browser`);
    console.log(`   🔐 Login: username=user, password=admin764`);
    console.log('');
  });
}

module.exports = app;
