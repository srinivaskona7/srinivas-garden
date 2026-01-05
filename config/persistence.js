/**
 * JSON File Persistence for Beautiful Garden
 * Saves and loads data from plants.json file
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'plants.json');
const DATA_DIR = path.dirname(DATA_FILE);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Save data to JSON file
function saveData(store) {
    try {
        const data = {
            plants: store.plants,
            gardens: store.gardens,
            layouts: store.layouts,
            idCounters: store.idCounters,
            savedAt: new Date().toISOString()
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log(`💾 Data saved to ${DATA_FILE}`);
        return true;
    } catch (error) {
        console.error('Error saving data:', error);
        return false;
    }
}

// Load data from JSON file
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            const data = JSON.parse(raw);
            console.log(`📂 Loaded data from ${DATA_FILE} (saved at ${data.savedAt})`);

            // Convert date strings back to Date objects
            if (data.plants) {
                data.plants = data.plants.map(plant => ({
                    ...plant,
                    createdAt: new Date(plant.createdAt),
                    updatedAt: new Date(plant.updatedAt),
                    plantedDate: plant.plantedDate ? new Date(plant.plantedDate) : null,
                    expectedHarvestDate: plant.expectedHarvestDate ? new Date(plant.expectedHarvestDate) : null,
                    versions: Object.fromEntries(
                        Object.entries(plant.versions || {}).map(([k, v]) => [
                            k,
                            { ...v, date: v.date ? new Date(v.date) : null }
                        ])
                    )
                }));
            }

            return data;
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
    return null;
}

// Check if saved data exists
function hasSavedData() {
    return fs.existsSync(DATA_FILE);
}

module.exports = { saveData, loadData, hasSavedData, DATA_FILE };
