/**
 * In-Memory Database Store with Growth Versions
 * V1: Before sowing (prepared soil)
 * V2: After sowing (sprouts)
 * V3: Medium growth phase
 * V4: Fully grown / harvest ready
 */

const { saveData, loadData, hasSavedData } = require('./persistence');

// In-memory storage
const store = {
    users: [
        {
            _id: 'user_1',
            username: 'user',
            password: 'admin764',
            role: 'admin',
            createdAt: new Date()
        }
    ],
    layouts: [],
    plants: [],
    gardens: [],
    idCounters: {
        users: 2,
        layouts: 1,
        plants: 1,
        gardens: 1
    },
    sessions: {}
};

// Auto-save helper - call after any data modification
function persistData() {
    saveData(store);
}

function generateId(collection) {
    return `${collection}_${Date.now()}_${store.idCounters[collection]++}`;
}

function generateSessionToken() {
    return 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Authentication
const Auth = {
    login: (username, password) => {
        const user = store.users.find(u => u.username === username && u.password === password);
        if (user) {
            const token = generateSessionToken();
            store.sessions[token] = { userId: user._id, createdAt: new Date() };
            return { success: true, token, user: { _id: user._id, username: user.username, role: user.role } };
        }
        return { success: false, message: 'Invalid credentials' };
    },
    logout: (token) => { delete store.sessions[token]; return { success: true }; },
    verify: (token) => {
        const session = store.sessions[token];
        if (session) {
            const user = store.users.find(u => u._id === session.userId);
            return user ? { _id: user._id, username: user.username, role: user.role } : null;
        }
        return null;
    }
};

// Initialize with sample leafy vegetables data
function initializeSampleData() {
    const now = new Date();

    // Sample Layouts (Garden Beds)
    store.layouts = [
        {
            _id: generateId('layouts'),
            name: 'Leafy Greens Bed A',
            description: 'Main bed for spinach and lettuce',
            image: '/images/hero-image.jpg',
            size: 'large',
            cropType: 'leafy-vegetables',
            position: 1,
            isActive: true,
            createdAt: now,
            updatedAt: now
        },
        {
            _id: generateId('layouts'),
            name: 'Herb Garden',
            description: 'Coriander, mint, and other herbs',
            image: null,
            size: 'medium',
            cropType: 'herbs',
            position: 2,
            isActive: true,
            createdAt: now,
            updatedAt: now
        },
        {
            _id: generateId('layouts'),
            name: 'Microgreens Tray',
            description: 'Fast growing microgreens',
            image: null,
            size: 'small',
            cropType: 'microgreens',
            position: 3,
            isActive: true,
            createdAt: now,
            updatedAt: now
        }
    ];

    // Sample Leafy Vegetables with Growth Versions
    store.plants = [
        {
            _id: generateId('plants'),
            name: 'Spinach',
            species: 'Spinacia oleracea',
            description: 'Nutritious leafy green, rich in iron',
            category: 'leafy-vegetable',
            isPriority: true,
            wateringFrequency: 'daily',
            sunlight: 'partial-sun',
            location: 'outdoor',
            healthStatus: 'excellent',
            careNotes: 'Keep soil moist. Harvest outer leaves first.',
            currentVersion: 'v3',
            versions: {
                v1: {
                    name: 'Prepared Soil',
                    description: 'Soil prepared, ready for sowing',
                    image: null,
                    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                    notes: 'Added compost and prepared rows'
                },
                v2: {
                    name: 'Sprouts',
                    description: 'Seeds germinated, small sprouts visible',
                    image: null,
                    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                    notes: 'Germination successful, thin seedlings'
                },
                v3: {
                    name: 'Growing',
                    description: 'Medium sized leaves, growing well',
                    image: null,
                    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                    notes: 'Healthy growth, regular watering'
                },
                v4: {
                    name: 'Ready to Harvest',
                    description: 'Fully grown, ready for harvest',
                    image: null,
                    date: null,
                    notes: null
                }
            },
            plantedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            expectedHarvestDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
            createdAt: now,
            updatedAt: now
        },
        {
            _id: generateId('plants'),
            name: 'Lettuce',
            species: 'Lactuca sativa',
            description: 'Crisp salad green, fast growing',
            category: 'leafy-vegetable',
            isPriority: true,
            wateringFrequency: 'daily',
            sunlight: 'partial-sun',
            location: 'outdoor',
            healthStatus: 'good',
            careNotes: 'Keep cool, water regularly',
            currentVersion: 'v2',
            versions: {
                v1: {
                    name: 'Prepared Soil',
                    description: 'Soil prepared for planting',
                    image: null,
                    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                    notes: 'Soil enriched with organic matter'
                },
                v2: {
                    name: 'Sprouts',
                    description: 'Small sprouts emerging',
                    image: null,
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    notes: 'Healthy sprouts, good germination rate'
                },
                v3: { name: 'Growing', description: 'Medium growth', image: null, date: null, notes: null },
                v4: { name: 'Ready to Harvest', description: 'Fully grown', image: null, date: null, notes: null }
            },
            plantedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            expectedHarvestDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
            createdAt: now,
            updatedAt: now
        },
        {
            _id: generateId('plants'),
            name: 'Coriander',
            species: 'Coriandrum sativum',
            description: 'Aromatic herb for cooking',
            category: 'leafy-vegetable',
            isPriority: true,
            wateringFrequency: 'daily',
            sunlight: 'partial-shade',
            location: 'indoor',
            healthStatus: 'excellent',
            careNotes: 'Keep soil consistently moist',
            currentVersion: 'v4',
            versions: {
                v1: {
                    name: 'Prepared Soil',
                    description: 'Container prepared',
                    image: null,
                    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
                    notes: 'Used potting mix'
                },
                v2: {
                    name: 'Sprouts',
                    description: 'Seeds sprouting',
                    image: null,
                    date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
                    notes: 'Good germination'
                },
                v3: {
                    name: 'Growing',
                    description: 'Leaves developing',
                    image: null,
                    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
                    notes: 'Thinned and growing well'
                },
                v4: {
                    name: 'Ready to Harvest',
                    description: 'Full size, harvesting regularly',
                    image: null,
                    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    notes: 'Harvesting leaves as needed'
                }
            },
            plantedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            expectedHarvestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            createdAt: now,
            updatedAt: now
        },
        {
            _id: generateId('plants'),
            name: 'Mint',
            species: 'Mentha',
            description: 'Refreshing herb, grows vigorously',
            category: 'leafy-vegetable',
            isPriority: true,
            wateringFrequency: 'daily',
            sunlight: 'partial-shade',
            location: 'indoor',
            healthStatus: 'excellent',
            careNotes: 'Keep contained, spreads quickly',
            currentVersion: 'v4',
            versions: {
                v1: { name: 'Prepared Soil', description: 'Container ready', image: null, date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), notes: 'Potted cutting' },
                v2: { name: 'Sprouts', description: 'New growth', image: null, date: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), notes: 'Roots established' },
                v3: { name: 'Growing', description: 'Spreading', image: null, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), notes: 'Growing vigorously' },
                v4: { name: 'Ready to Harvest', description: 'Fully established', image: null, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), notes: 'Regular harvesting' }
            },
            plantedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            createdAt: now,
            updatedAt: now
        },
        {
            _id: generateId('plants'),
            name: 'Methi (Fenugreek)',
            species: 'Trigonella foenum-graecum',
            description: 'Popular Indian leafy vegetable',
            category: 'leafy-vegetable',
            isPriority: true,
            wateringFrequency: 'daily',
            sunlight: 'full-sun',
            location: 'outdoor',
            healthStatus: 'good',
            careNotes: 'Fast growing, harvest in 3-4 weeks',
            currentVersion: 'v1',
            versions: {
                v1: { name: 'Prepared Soil', description: 'Ready for sowing', image: null, date: now, notes: 'Soil prepared today' },
                v2: { name: 'Sprouts', description: 'Awaiting germination', image: null, date: null, notes: null },
                v3: { name: 'Growing', description: 'Not yet', image: null, date: null, notes: null },
                v4: { name: 'Ready to Harvest', description: 'Not yet', image: null, date: null, notes: null }
            },
            plantedDate: now,
            expectedHarvestDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
            createdAt: now,
            updatedAt: now
        },
        {
            _id: generateId('plants'),
            name: 'Palak (Indian Spinach)',
            species: 'Beta vulgaris',
            description: 'Popular leafy green for Indian dishes',
            category: 'leafy-vegetable',
            isPriority: true,
            wateringFrequency: 'daily',
            sunlight: 'partial-sun',
            location: 'outdoor',
            healthStatus: 'excellent',
            careNotes: 'Multiple harvests possible',
            currentVersion: 'v2',
            versions: {
                v1: { name: 'Prepared Soil', description: 'Bed prepared', image: null, date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), notes: 'Added manure' },
                v2: { name: 'Sprouts', description: 'Seedlings emerging', image: null, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), notes: 'Good germination' },
                v3: { name: 'Growing', description: 'Not yet', image: null, date: null, notes: null },
                v4: { name: 'Ready to Harvest', description: 'Not yet', image: null, date: null, notes: null }
            },
            plantedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            expectedHarvestDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            createdAt: now,
            updatedAt: now
        }
    ];

    store.gardens = [
        {
            _id: generateId('gardens'),
            name: 'Kitchen Garden',
            description: 'Daily use leafy vegetables',
            location: 'backyard',
            size: 'medium',
            gardenType: 'vegetable',
            plants: [store.plants[0]._id, store.plants[1]._id, store.plants[4]._id, store.plants[5]._id],
            isActive: true,
            createdAt: now,
            updatedAt: now
        },
        {
            _id: generateId('gardens'),
            name: 'Herb Corner',
            description: 'Fresh herbs for cooking',
            location: 'indoor',
            size: 'small',
            gardenType: 'herb',
            plants: [store.plants[2]._id, store.plants[3]._id],
            isActive: true,
            createdAt: now,
            updatedAt: now
        }
    ];

    console.log('🌿 In-memory database initialized with leafy vegetables!');
    console.log(`   📊 ${store.plants.length} plants (with growth versions)`);
    console.log(`   🏡 ${store.gardens.length} gardens`);
    console.log(`   📐 ${store.layouts.length} layouts`);
    console.log(`   👤 Admin: user / admin764`);

    // Save initial data
    persistData();
}

// Load persisted data or initialize with sample data
function initializeDatabase() {
    if (hasSavedData()) {
        const saved = loadData();
        if (saved) {
            store.plants = saved.plants || [];
            store.gardens = saved.gardens || [];
            store.layouts = saved.layouts || [];
            if (saved.idCounters) {
                store.idCounters = { ...store.idCounters, ...saved.idCounters };
            }
            console.log('✅ Loaded persisted data from JSON file');
            console.log(`   📊 ${store.plants.length} plants`);
            console.log(`   🏡 ${store.gardens.length} gardens`);
            console.log(`   👤 Admin: user / admin764`);
            return;
        }
    }
    // No saved data, initialize with sample data
    initializeSampleData();
}

// Layout Model
const Layout = {
    find: async (query = {}) => {
        let results = [...store.layouts];
        if (query.isActive !== undefined) results = results.filter(l => l.isActive === query.isActive);
        results.sort((a, b) => a.position - b.position);
        return results;
    },
    findById: async (id) => store.layouts.find(l => l._id === id) || null,
    findByIdAndUpdate: async (id, update) => {
        const index = store.layouts.findIndex(l => l._id === id);
        if (index === -1) return null;
        store.layouts[index] = { ...store.layouts[index], ...update, updatedAt: new Date() };
        persistData();
        return store.layouts[index];
    },
    findByIdAndDelete: async (id) => {
        const index = store.layouts.findIndex(l => l._id === id);
        if (index === -1) return null;
        const deleted = store.layouts[index];
        store.layouts.splice(index, 1);
        persistData();
        return deleted;
    },
    countDocuments: async () => store.layouts.length
};

function createLayout(data) {
    const layout = {
        ...data,
        _id: generateId('layouts'),
        position: store.layouts.length + 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    layout.save = async function () { store.layouts.push(this); persistData(); return this; };
    return layout;
}

// Plant Model with Version Support
const Plant = {
    find: async (query = {}) => {
        let results = [...store.plants];
        if (query.location) results = results.filter(p => p.location === query.location);
        if (query.healthStatus) results = results.filter(p => p.healthStatus === query.healthStatus);
        if (query.category) results = results.filter(p => p.category === query.category);
        if (query.isPriority) results = results.filter(p => p.isPriority === true);

        // Sort priority plants first
        results.sort((a, b) => {
            if (a.isPriority && !b.isPriority) return -1;
            if (!a.isPriority && b.isPriority) return 1;
            return 0;
        });

        return {
            sort: () => ({
                limit: () => ({
                    skip: () => results
                })
            }),
            populate: () => ({
                sort: () => ({
                    limit: () => ({
                        skip: () => results
                    })
                })
            })
        };
    },
    findById: async (id) => {
        const plant = store.plants.find(p => p._id === id);
        if (!plant) return null;
        return {
            ...plant,
            save: async function () {
                const index = store.plants.findIndex(p => p._id === this._id);
                if (index !== -1) {
                    store.plants[index] = { ...this, updatedAt: new Date() };
                    persistData();
                }
                return this;
            },
            updateVersion: function (version, data) {
                if (this.versions && this.versions[version]) {
                    this.versions[version] = { ...this.versions[version], ...data };
                    if (data.date && !this.versions[version].date) {
                        this.versions[version].date = new Date();
                    }
                }
                return this;
            }
        };
    },
    findByIdAndUpdate: async (id, update) => {
        const index = store.plants.findIndex(p => p._id === id);
        if (index === -1) return null;
        store.plants[index] = { ...store.plants[index], ...update, updatedAt: new Date() };
        persistData();
        return store.plants[index];
    },
    findByIdAndDelete: async (id) => {
        const index = store.plants.findIndex(p => p._id === id);
        if (index === -1) return null;
        const deleted = store.plants[index];
        store.plants.splice(index, 1);
        persistData();
        return deleted;
    },
    countDocuments: async () => store.plants.length
};

function createPlant(data) {
    const startVersion = data.currentVersion || 'v1';
    const versionOrder = ['v1', 'v2', 'v3', 'v4'];
    const startIndex = versionOrder.indexOf(startVersion);
    const now = new Date();

    // Create versions with dates for all completed stages
    const versions = {
        v1: { name: 'Prepared Soil', description: 'Ready for sowing', image: null, date: startIndex >= 0 ? now : null, notes: startVersion === 'v1' ? (data.versionNotes || null) : 'Completed' },
        v2: { name: 'Sprouts', description: 'Seeds germinated', image: null, date: startIndex >= 1 ? now : null, notes: startVersion === 'v2' ? (data.versionNotes || null) : (startIndex > 1 ? 'Completed' : null) },
        v3: { name: 'Growing', description: 'Medium growth phase', image: null, date: startIndex >= 2 ? now : null, notes: startVersion === 'v3' ? (data.versionNotes || null) : (startIndex > 2 ? 'Completed' : null) },
        v4: { name: 'Ready to Harvest', description: 'Fully grown', image: null, date: startIndex >= 3 ? now : null, notes: startVersion === 'v4' ? (data.versionNotes || null) : null }
    };

    const plant = {
        ...data,
        _id: generateId('plants'),
        category: data.category || 'leafy-vegetable',
        isPriority: data.isPriority !== undefined ? data.isPriority : true,
        healthStatus: 'good',
        currentVersion: startVersion,
        versions,
        plantedDate: now,
        createdAt: now,
        updatedAt: now
    };
    plant.save = async function () { store.plants.push(this); persistData(); return this; };
    return plant;
}

// Garden Model
const Garden = {
    find: async (query = {}) => {
        let results = [...store.gardens];
        results = results.map(g => ({
            ...g,
            plants: g.plants.map(plantId => store.plants.find(p => p._id === plantId)).filter(Boolean)
        }));
        return {
            populate: () => ({ sort: () => ({ limit: () => ({ skip: () => results }) }) }),
            sort: () => ({ limit: () => ({ skip: () => results }) })
        };
    },
    findById: async (id) => {
        const garden = store.gardens.find(g => g._id === id);
        if (!garden) return null;
        return {
            ...garden,
            plants: garden.plants.map(plantId => store.plants.find(p => p._id === plantId)).filter(Boolean),
            addPlant: function (plantId) { if (!this.plants.find(p => p._id === plantId)) this.plants.push(plantId); return this; },
            removePlant: function (plantId) { this.plants = this.plants.filter(p => (p._id || p) !== plantId); return this; },
            save: async function () {
                const index = store.gardens.findIndex(g => g._id === this._id);
                if (index !== -1) store.gardens[index] = { ...store.gardens[index], plants: this.plants.map(p => p._id || p), updatedAt: new Date() };
                return this;
            }
        };
    },
    findByIdAndUpdate: async (id, update) => {
        const index = store.gardens.findIndex(g => g._id === id);
        if (index === -1) return null;
        store.gardens[index] = { ...store.gardens[index], ...update, updatedAt: new Date() };
        return store.gardens[index];
    },
    findByIdAndDelete: async (id) => {
        const index = store.gardens.findIndex(g => g._id === id);
        if (index === -1) return null;
        const deleted = store.gardens[index];
        store.gardens.splice(index, 1);
        return deleted;
    },
    countDocuments: async () => store.gardens.length
};

function createGarden(data) {
    const garden = { ...data, plants: data.plants || [], _id: generateId('gardens'), createdAt: new Date(), updatedAt: new Date() };
    garden.save = async function () { store.gardens.push(this); persistData(); return this; };
    return garden;
}

module.exports = {
    Auth, Layout, Plant, Garden,
    createLayout, createPlant, createGarden,
    initializeSampleData, initializeDatabase, persistData, store
};
