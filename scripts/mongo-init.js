// MongoDB initialization script
// This runs when the container starts for the first time

// Switch to the application database
db = db.getSiblingDB('beautiful-garden');

// Create application user
db.createUser({
    user: 'garden',
    pwd: 'garden123',
    roles: [
        {
            role: 'readWrite',
            db: 'beautiful-garden'
        }
    ]
});

// Create indexes
db.plants.createIndex({ name: 'text', species: 'text', description: 'text' });
db.plants.createIndex({ healthStatus: 1 });
db.plants.createIndex({ location: 1 });
db.plants.createIndex({ nextWatering: 1 });

db.gardens.createIndex({ name: 'text', description: 'text' });
db.gardens.createIndex({ location: 1 });
db.gardens.createIndex({ gardenType: 1 });

// Insert sample data
db.plants.insertMany([
    {
        name: 'Rose Bush',
        species: 'Rosa gallica',
        description: 'Beautiful red roses that bloom in spring',
        wateringFrequency: 'every-2-days',
        sunlight: 'full-sun',
        location: 'outdoor',
        healthStatus: 'excellent',
        careNotes: 'Prune after flowering. Fertilize monthly during growing season.',
        plantedDate: new Date(),
        lastWatered: new Date(),
        nextWatering: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        tags: ['flowering', 'fragrant', 'thorny'],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Basil',
        species: 'Ocimum basilicum',
        description: 'Fresh herb for cooking',
        wateringFrequency: 'daily',
        sunlight: 'full-sun',
        location: 'indoor',
        healthStatus: 'good',
        careNotes: 'Pinch off flower buds to encourage leaf growth.',
        plantedDate: new Date(),
        lastWatered: new Date(),
        nextWatering: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        tags: ['herb', 'culinary', 'aromatic'],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Snake Plant',
        species: 'Sansevieria trifasciata',
        description: 'Low maintenance indoor plant',
        wateringFrequency: 'bi-weekly',
        sunlight: 'partial-shade',
        location: 'indoor',
        healthStatus: 'excellent',
        careNotes: 'Very drought tolerant. Do not overwater.',
        plantedDate: new Date(),
        lastWatered: new Date(),
        nextWatering: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        tags: ['succulent', 'low-maintenance', 'air-purifying'],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Tomato Plant',
        species: 'Solanum lycopersicum',
        description: 'Cherry tomatoes for salads',
        wateringFrequency: 'daily',
        sunlight: 'full-sun',
        location: 'balcony',
        healthStatus: 'good',
        careNotes: 'Stake when tall. Remove suckers for better fruit.',
        plantedDate: new Date(),
        lastWatered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago - needs water!
        nextWatering: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        tags: ['vegetable', 'edible', 'annual'],
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Get plant IDs for garden
const plants = db.plants.find({}).toArray();

db.gardens.insertMany([
    {
        name: 'Kitchen Herb Garden',
        description: 'Fresh herbs for cooking right at my windowsill',
        location: 'indoor',
        size: 'small',
        gardenType: 'herb',
        climate: 'temperate',
        soilType: 'loamy',
        plants: [plants.find(p => p.name === 'Basil')._id],
        notes: 'Keep near sunny window. Rotate pots weekly.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Backyard Paradise',
        description: 'My main flower and vegetable garden',
        location: 'backyard',
        size: 'large',
        gardenType: 'mixed',
        climate: 'temperate',
        soilType: 'loamy',
        plants: [
            plants.find(p => p.name === 'Rose Bush')._id,
            plants.find(p => p.name === 'Tomato Plant')._id
        ],
        notes: 'Main garden area with automatic irrigation.',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

print('✅ Beautiful Garden database initialized with sample data!');
print('📊 Created ' + db.plants.countDocuments() + ' plants');
print('🏡 Created ' + db.gardens.countDocuments() + ' gardens');
