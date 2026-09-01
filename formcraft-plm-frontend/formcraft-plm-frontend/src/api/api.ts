// src/api/api.ts

const API_BASE_URL = '/api';

function getAuthHeaders() {
    const creds = btoa('admin:admin123'); // Hardcoded for POC to avoid login screen complexity, matching your backend config
    return {
        'Authorization': `Basic ${creds}`,
        'Content-Type': 'application/json'
    };
}

export async function fetchProducts(page = 0, size = 20) {
    const res = await fetch(`${API_BASE_URL}/products?page=${page}&size=${size}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

export async function fetchProduct(id: number) {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
}

export async function fetchComposition(id: number) {
    const res = await fetch(`${API_BASE_URL}/products/${id}/composition`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch composition');
    return res.json();
}

export async function runFormulation(id: number) {
    const res = await fetch(`${API_BASE_URL}/products/${id}/formulate`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Formulation failed');
    return res.json();
}

export async function runQualityChecks(id: number) {
    const res = await fetch(`${API_BASE_URL}/products/${id}/quality/run-all`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Quality checks failed');
    return res.json();
}

export async function transitionWorkflow(id: number, action: 'submit' | 'approve' | 'reject') {
    const res = await fetch(`${API_BASE_URL}/products/${id}/workflow/${action}`, {
        method: 'POST',
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Workflow transition failed');
    return res.json();
}

export async function getStats() {
    const res = await fetch(`${API_BASE_URL}/products/stats`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
}

export async function createProduct(data: any) {
    const res = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create product');
    return res.json();
}

export async function searchRawMaterials() {
    const res = await fetch(`${API_BASE_URL}/products/search?type=RAW_MATERIAL`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch raw materials');
    return res.json();
}

export async function addComposition(productId: number, data: any) {
    const res = await fetch(`${API_BASE_URL}/products/${productId}/composition`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to add composition line');
    return res.json();
}
