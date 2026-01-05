/**
 * Plants API Tests using Vitest
 */
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server.js';

describe('Plants API', () => {

    describe('GET /api/plants', () => {
        it('should return all plants with success status', async () => {
            const res = await request(app).get('/api/plants');

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('should return plants with version structure', async () => {
            const res = await request(app).get('/api/plants');

            const plant = res.body.data[0];
            expect(plant).toHaveProperty('_id');
            expect(plant).toHaveProperty('name');
            expect(plant).toHaveProperty('currentVersion');
            expect(plant).toHaveProperty('versions');
            expect(plant.versions).toHaveProperty('v1');
            expect(plant.versions).toHaveProperty('v2');
            expect(plant.versions).toHaveProperty('v3');
            expect(plant.versions).toHaveProperty('v4');
        });
    });

    describe('POST /api/plants', () => {
        it('should create a new plant', async () => {
            const newPlant = {
                name: 'Test Spinach',
                species: 'Spinacia oleracea',
                category: 'leafy-vegetable',
                currentVersion: 'v1'
            };

            const res = await request(app)
                .post('/api/plants')
                .send(newPlant);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe('Test Spinach');
        });

        it('should create plant at specified version', async () => {
            const res = await request(app)
                .post('/api/plants')
                .send({ name: 'V3 Plant', currentVersion: 'v3' });

            expect(res.body.data.currentVersion).toBe('v3');
            expect(res.body.data.versions.v1.date).toBeTruthy();
            expect(res.body.data.versions.v2.date).toBeTruthy();
        });
    });

    describe('PATCH /api/plants/:id/advance', () => {
        let plantId;

        beforeAll(async () => {
            const res = await request(app)
                .post('/api/plants')
                .send({ name: 'Advance Plant', currentVersion: 'v1' });
            plantId = res.body.data._id;
        });

        it('should advance plant to next version', async () => {
            const res = await request(app)
                .patch(`/api/plants/${plantId}/advance`)
                .send({});

            expect(res.status).toBe(200);
            expect(res.body.data.currentVersion).toBe('v2');
        });
    });

    describe('DELETE /api/plants/:id', () => {
        it('should delete a plant', async () => {
            const createRes = await request(app)
                .post('/api/plants')
                .send({ name: 'Delete Me' });

            const deleteRes = await request(app)
                .delete(`/api/plants/${createRes.body.data._id}`);

            expect(deleteRes.status).toBe(200);
            expect(deleteRes.body.success).toBe(true);
        });
    });
});

describe('Auth API', () => {
    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'user', password: 'admin764' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.token).toBeDefined();
        });

        it('should reject invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({ username: 'wrong', password: 'wrong' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
});

describe('Health Check', () => {
    it('should return healthy status', async () => {
        const res = await request(app).get('/health');

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('healthy');
    });
});
