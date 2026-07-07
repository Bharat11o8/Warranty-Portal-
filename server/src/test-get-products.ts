import { CatalogController } from './controllers/catalog.controller.js';
import { Request, Response } from 'express';

async function testGetProducts() {
    console.log('--- Testing CatalogController.getProducts ---');
    const mockReq = {
        query: {}
    } as unknown as Request;

    const mockRes = {
        json: (data: any) => {
            console.log('Success response!');
            console.log('Products count:', data?.products?.length);
            if (data?.products?.length > 0) {
                console.log('Sample product structure:', JSON.stringify(data.products[0], null, 2));
            } else {
                console.log('No products returned.');
            }
        },
        status: (code: number) => {
            console.log('Status code set:', code);
            return mockRes;
        }
    } as unknown as Response;

    try {
        await CatalogController.getProducts(mockReq, mockRes);
    } catch (err: any) {
        console.error('Error in getProducts:', err);
    } finally {
        process.exit();
    }
}

testGetProducts();
