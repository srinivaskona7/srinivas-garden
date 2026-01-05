const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Plant name is required'],
        trim: true,
        maxlength: [100, 'Plant name cannot exceed 100 characters']
    },
    species: {
        type: String,
        trim: true,
        maxlength: [150, 'Species name cannot exceed 150 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    wateringFrequency: {
        type: String,
        enum: ['daily', 'every-2-days', 'every-3-days', 'weekly', 'bi-weekly', 'monthly'],
        default: 'weekly'
    },
    lastWatered: {
        type: Date,
        default: null
    },
    nextWatering: {
        type: Date,
        default: null
    },
    sunlight: {
        type: String,
        enum: ['full-sun', 'partial-sun', 'partial-shade', 'full-shade'],
        default: 'partial-sun'
    },
    location: {
        type: String,
        enum: ['indoor', 'outdoor', 'greenhouse', 'balcony'],
        default: 'indoor'
    },
    careNotes: {
        type: String,
        trim: true,
        maxlength: [2000, 'Care notes cannot exceed 2000 characters']
    },
    healthStatus: {
        type: String,
        enum: ['excellent', 'good', 'fair', 'poor', 'critical'],
        default: 'good'
    },
    photo: {
        type: String,
        default: null
    },
    plantedDate: {
        type: Date,
        default: Date.now
    },
    tags: [{
        type: String,
        trim: true
    }]
}, {
    timestamps: true
});

// Index for faster queries
plantSchema.index({ name: 'text', species: 'text', description: 'text' });
plantSchema.index({ healthStatus: 1 });
plantSchema.index({ location: 1 });

// Virtual for days since planted
plantSchema.virtual('daysSincePlanted').get(function () {
    if (!this.plantedDate) return 0;
    const now = new Date();
    const planted = new Date(this.plantedDate);
    const diffTime = Math.abs(now - planted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

// Virtual for watering status
plantSchema.virtual('needsWater').get(function () {
    if (!this.nextWatering) return false;
    return new Date() >= new Date(this.nextWatering);
});

// Method to calculate next watering date
plantSchema.methods.calculateNextWatering = function () {
    const frequencyDays = {
        'daily': 1,
        'every-2-days': 2,
        'every-3-days': 3,
        'weekly': 7,
        'bi-weekly': 14,
        'monthly': 30
    };

    const days = frequencyDays[this.wateringFrequency] || 7;
    const lastWatered = this.lastWatered || new Date();
    this.nextWatering = new Date(lastWatered.getTime() + days * 24 * 60 * 60 * 1000);
    return this.nextWatering;
};

// Pre-save middleware
plantSchema.pre('save', function (next) {
    if (this.isModified('lastWatered') || this.isModified('wateringFrequency')) {
        this.calculateNextWatering();
    }
    next();
});

// Ensure virtuals are included in JSON output
plantSchema.set('toJSON', { virtuals: true });
plantSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Plant', plantSchema);
