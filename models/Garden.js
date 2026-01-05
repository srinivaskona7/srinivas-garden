const mongoose = require('mongoose');

const gardenSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Garden name is required'],
        trim: true,
        maxlength: [100, 'Garden name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    location: {
        type: String,
        enum: ['front-yard', 'backyard', 'balcony', 'indoor', 'rooftop', 'greenhouse', 'community'],
        default: 'backyard'
    },
    size: {
        type: String,
        enum: ['small', 'medium', 'large', 'extra-large'],
        default: 'medium'
    },
    gardenType: {
        type: String,
        enum: ['flower', 'vegetable', 'herb', 'succulent', 'tropical', 'mixed'],
        default: 'mixed'
    },
    plants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plant'
    }],
    notes: {
        type: String,
        trim: true,
        maxlength: [2000, 'Notes cannot exceed 2000 characters']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    climate: {
        type: String,
        enum: ['tropical', 'subtropical', 'temperate', 'mediterranean', 'arid', 'continental'],
        default: 'temperate'
    },
    soilType: {
        type: String,
        enum: ['clay', 'sandy', 'loamy', 'peaty', 'chalky', 'silty'],
        default: 'loamy'
    }
}, {
    timestamps: true
});

// Index for faster queries
gardenSchema.index({ name: 'text', description: 'text' });
gardenSchema.index({ location: 1 });
gardenSchema.index({ gardenType: 1 });

// Virtual for plant count
gardenSchema.virtual('plantCount').get(function () {
    return this.plants ? this.plants.length : 0;
});

// Method to add a plant to the garden
gardenSchema.methods.addPlant = function (plantId) {
    if (!this.plants.includes(plantId)) {
        this.plants.push(plantId);
    }
    return this;
};

// Method to remove a plant from the garden
gardenSchema.methods.removePlant = function (plantId) {
    this.plants = this.plants.filter(id => id.toString() !== plantId.toString());
    return this;
};

// Ensure virtuals are included in JSON output
gardenSchema.set('toJSON', { virtuals: true });
gardenSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Garden', gardenSchema);
