// Beautiful Garden - Client-side JavaScript

const API_BASE = '/api';

// ============================================
// Toast Notifications
// ============================================
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// Modal Management
// ============================================
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal.active');
        if (activeModal) {
            closeModal(activeModal.id);
        }
    }
});

// ============================================
// Plant Management
// ============================================
function showAddPlantModal() {
    const modalTitle = document.getElementById('plantModalTitle');
    const submitBtn = document.getElementById('plantSubmitBtn');
    const editIdField = document.getElementById('editPlantId');

    if (modalTitle) modalTitle.textContent = '🌱 Add New Plant';
    if (submitBtn) submitBtn.textContent = 'Add Plant';
    if (editIdField) editIdField.value = '';

    showModal('addPlantModal');
}

async function handleAddPlant(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const editId = formData.get('editId');

    const plantData = {
        name: formData.get('name'),
        species: formData.get('species'),
        description: formData.get('description'),
        wateringFrequency: formData.get('wateringFrequency'),
        sunlight: formData.get('sunlight'),
        location: formData.get('location'),
        healthStatus: formData.get('healthStatus'),
        careNotes: formData.get('careNotes')
    };

    try {
        let response;
        if (editId) {
            response = await fetch(`${API_BASE}/plants/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(plantData)
            });
        } else {
            response = await fetch(`${API_BASE}/plants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(plantData)
            });
        }

        const result = await response.json();

        if (result.success) {
            showToast(editId ? 'Plant updated successfully!' : 'Plant added successfully!', 'success');
            closeModal('addPlantModal');
            // Reload page to show new plant
            setTimeout(() => location.reload(), 500);
        } else {
            showToast(result.message || 'Error saving plant', 'error');
        }
    } catch (error) {
        console.error('Error saving plant:', error);
        showToast('Error saving plant. Please try again.', 'error');
    }
}

async function editPlant(plantId) {
    try {
        const response = await fetch(`${API_BASE}/plants/${plantId}`);
        const result = await response.json();

        if (result.success) {
            const plant = result.data;

            // Populate form with plant data
            document.getElementById('editPlantId').value = plant._id;
            document.getElementById('plantName').value = plant.name || '';
            document.getElementById('plantSpecies').value = plant.species || '';

            const descField = document.getElementById('plantDescription');
            if (descField) descField.value = plant.description || '';

            document.getElementById('wateringFrequency').value = plant.wateringFrequency || 'weekly';
            document.getElementById('sunlight').value = plant.sunlight || 'partial-sun';
            document.getElementById('location').value = plant.location || 'indoor';
            document.getElementById('healthStatus').value = plant.healthStatus || 'good';
            document.getElementById('careNotes').value = plant.careNotes || '';

            // Update modal title and button
            const modalTitle = document.getElementById('plantModalTitle');
            const submitBtn = document.getElementById('plantSubmitBtn');
            if (modalTitle) modalTitle.textContent = '✏️ Edit Plant';
            if (submitBtn) submitBtn.textContent = 'Update Plant';

            showModal('addPlantModal');
        } else {
            showToast('Error loading plant data', 'error');
        }
    } catch (error) {
        console.error('Error loading plant:', error);
        showToast('Error loading plant. Please try again.', 'error');
    }
}

async function deletePlant(plantId) {
    if (!confirm('Are you sure you want to delete this plant?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/plants/${plantId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Plant deleted successfully!', 'success');
            // Remove card from DOM
            const card = document.querySelector(`.plant-card[data-id="${plantId}"]`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                setTimeout(() => card.remove(), 300);
            }
        } else {
            showToast(result.message || 'Error deleting plant', 'error');
        }
    } catch (error) {
        console.error('Error deleting plant:', error);
        showToast('Error deleting plant. Please try again.', 'error');
    }
}

async function waterPlant(plantId) {
    try {
        const response = await fetch(`${API_BASE}/plants/${plantId}/water`, {
            method: 'PATCH'
        });

        const result = await response.json();

        if (result.success) {
            showToast('🌱 Plant watered successfully!', 'success');
            setTimeout(() => location.reload(), 500);
        } else {
            showToast(result.message || 'Error watering plant', 'error');
        }
    } catch (error) {
        console.error('Error watering plant:', error);
        showToast('Error watering plant. Please try again.', 'error');
    }
}

async function waterAllPlants() {
    if (!confirm('Water all plants that need watering?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/plants/status/needs-water`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            for (const plant of result.data) {
                await fetch(`${API_BASE}/plants/${plant._id}/water`, { method: 'PATCH' });
            }
            showToast(`💧 Watered ${result.data.length} plants!`, 'success');
            setTimeout(() => location.reload(), 500);
        } else {
            showToast('No plants need watering right now!', 'success');
        }
    } catch (error) {
        console.error('Error watering plants:', error);
        showToast('Error watering plants. Please try again.', 'error');
    }
}

// Filter plants
function filterPlants() {
    const location = document.getElementById('filterLocation')?.value || '';
    const health = document.getElementById('filterHealth')?.value || '';
    const search = document.getElementById('searchPlants')?.value.toLowerCase() || '';

    const cards = document.querySelectorAll('.plant-card');

    cards.forEach(card => {
        const cardLocation = card.dataset.location || '';
        const cardHealth = card.dataset.health || '';
        const cardName = card.querySelector('.plant-name')?.textContent.toLowerCase() || '';
        const cardSpecies = card.querySelector('.plant-species')?.textContent.toLowerCase() || '';

        const matchesLocation = !location || cardLocation === location;
        const matchesHealth = !health || cardHealth === health;
        const matchesSearch = !search || cardName.includes(search) || cardSpecies.includes(search);

        if (matchesLocation && matchesHealth && matchesSearch) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// ============================================
// Garden Management
// ============================================
function showAddGardenModal() {
    const modalTitle = document.getElementById('gardenModalTitle');
    const submitBtn = document.getElementById('gardenSubmitBtn');
    const editIdField = document.getElementById('editGardenId');

    if (modalTitle) modalTitle.textContent = '🏡 Create New Garden';
    if (submitBtn) submitBtn.textContent = 'Create Garden';
    if (editIdField) editIdField.value = '';

    showModal('addGardenModal');
}

async function handleAddGarden(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const editId = formData.get('editId');

    const gardenData = {
        name: formData.get('name'),
        description: formData.get('description'),
        location: formData.get('location'),
        gardenType: formData.get('gardenType'),
        size: formData.get('size'),
        climate: formData.get('climate'),
        soilType: formData.get('soilType'),
        notes: formData.get('notes')
    };

    try {
        let response;
        if (editId) {
            response = await fetch(`${API_BASE}/gardens/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gardenData)
            });
        } else {
            response = await fetch(`${API_BASE}/gardens`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gardenData)
            });
        }

        const result = await response.json();

        if (result.success) {
            showToast(editId ? 'Garden updated successfully!' : 'Garden created successfully!', 'success');
            closeModal('addGardenModal');
            setTimeout(() => location.reload(), 500);
        } else {
            showToast(result.message || 'Error saving garden', 'error');
        }
    } catch (error) {
        console.error('Error saving garden:', error);
        showToast('Error saving garden. Please try again.', 'error');
    }
}

async function editGarden(gardenId) {
    try {
        const response = await fetch(`${API_BASE}/gardens/${gardenId}`);
        const result = await response.json();

        if (result.success) {
            const garden = result.data;

            document.getElementById('editGardenId').value = garden._id;
            document.getElementById('gardenName').value = garden.name || '';
            document.getElementById('gardenDescription').value = garden.description || '';
            document.getElementById('gardenLocation').value = garden.location || 'backyard';
            document.getElementById('gardenType').value = garden.gardenType || 'mixed';
            document.getElementById('gardenSize').value = garden.size || 'medium';

            const climateField = document.getElementById('climate');
            if (climateField) climateField.value = garden.climate || 'temperate';

            document.getElementById('soilType').value = garden.soilType || 'loamy';

            const notesField = document.getElementById('gardenNotes');
            if (notesField) notesField.value = garden.notes || '';

            const modalTitle = document.getElementById('gardenModalTitle');
            const submitBtn = document.getElementById('gardenSubmitBtn');
            if (modalTitle) modalTitle.textContent = '✏️ Edit Garden';
            if (submitBtn) submitBtn.textContent = 'Update Garden';

            showModal('addGardenModal');
        } else {
            showToast('Error loading garden data', 'error');
        }
    } catch (error) {
        console.error('Error loading garden:', error);
        showToast('Error loading garden. Please try again.', 'error');
    }
}

async function deleteGarden(gardenId) {
    if (!confirm('Are you sure you want to delete this garden?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/gardens/${gardenId}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Garden deleted successfully!', 'success');
            const card = document.querySelector(`.garden-card[data-id="${gardenId}"]`);
            if (card) {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                setTimeout(() => card.remove(), 300);
            }
        } else {
            showToast(result.message || 'Error deleting garden', 'error');
        }
    } catch (error) {
        console.error('Error deleting garden:', error);
        showToast('Error deleting garden. Please try again.', 'error');
    }
}

function showAddPlantToGardenModal(gardenId) {
    document.getElementById('targetGardenId').value = gardenId;
    showModal('addPlantToGardenModal');
}

async function handleAddPlantToGarden(event) {
    event.preventDefault();

    const gardenId = document.getElementById('targetGardenId').value;
    const checkboxes = document.querySelectorAll('#plantsCheckboxList input[type="checkbox"]:checked');

    if (checkboxes.length === 0) {
        showToast('Please select at least one plant', 'warning');
        return;
    }

    try {
        for (const checkbox of checkboxes) {
            const plantId = checkbox.value;
            await fetch(`${API_BASE}/gardens/${gardenId}/plants/${plantId}`, {
                method: 'POST'
            });
        }

        showToast(`Added ${checkboxes.length} plant(s) to garden!`, 'success');
        closeModal('addPlantToGardenModal');
        setTimeout(() => location.reload(), 500);
    } catch (error) {
        console.error('Error adding plants to garden:', error);
        showToast('Error adding plants to garden. Please try again.', 'error');
    }
}

// ============================================
// Stats & Dashboard
// ============================================
async function loadStats() {
    try {
        // Load total plants
        const plantsResponse = await fetch(`${API_BASE}/plants`);
        const plantsResult = await plantsResponse.json();
        const totalPlantsEl = document.getElementById('totalPlants');
        if (totalPlantsEl) {
            animateNumber(totalPlantsEl, plantsResult.total || 0);
        }

        // Load total gardens
        const gardensResponse = await fetch(`${API_BASE}/gardens`);
        const gardensResult = await gardensResponse.json();
        const totalGardensEl = document.getElementById('totalGardens');
        if (totalGardensEl) {
            animateNumber(totalGardensEl, gardensResult.total || 0);
        }

        // Load plants needing water
        const waterResponse = await fetch(`${API_BASE}/plants/status/needs-water`);
        const waterResult = await waterResponse.json();
        const needsWaterEl = document.getElementById('needsWater');
        if (needsWaterEl) {
            animateNumber(needsWaterEl, waterResult.count || 0);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function animateNumber(element, target) {
    const duration = 1000;
    const start = 0;
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.round(start + (target - start) * easeOutQuart);

        element.textContent = current;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// ============================================
// Initialize
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Load stats on homepage
    if (document.getElementById('totalPlants')) {
        loadStats();
    }

    // Add smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});
