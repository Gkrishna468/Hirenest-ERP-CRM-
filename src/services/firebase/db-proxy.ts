/**
 * Database Proxy Client
 * Used to bypass Firestore Client SDK permission issues by routing requests through the server.
 */

const API_BASE = '/api/db';

async function fetchProxy(body: any) {
  const token = localStorage.getItem('fb_token'); // Get custom token or ID token if available
  
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
    body: JSON.stringify(body),
  });
  
  if (!res.ok) {
    const text = await res.text();
    let err;
    try {
      err = text ? JSON.parse(text) : {};
    } catch (e) {
      throw new Error(`Database proxy error (${res.status}): ${text || "Unknown server error"}`);
    }
    throw new Error(err?.error || `Database proxy error (${res.status})`);
  }
  
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch (e) {
    throw new Error(`Invalid JSON response: ${text || "Unknown server error"}`);
  }
}

export const dbProxy = {
  async getDoc(collection: string, docId: string) {
    return fetchProxy({ collection, docId, method: 'GET_DOC' });
  },
  
  async getDocs(collection: string, queryParams?: any) {
    return fetchProxy({ collection, method: 'GET_DOCS', query: queryParams });
  },
  
  async setDoc(collection: string, docId: string, payload: any) {
    return fetchProxy({ collection, docId, method: 'SET_DOC', payload });
  },
  
  async addDoc(collection: string, payload: any) {
    return fetchProxy({ collection, method: 'ADD_DOC', payload });
  },
  
  async updateDoc(collection: string, docId: string, payload: any) {
    return fetchProxy({ collection, docId, method: 'UPDATE_DOC', payload });
  },
  
  async deleteDoc(collection: string, docId: string) {
    return fetchProxy({ collection, docId, method: 'DELETE_DOC' });
  }
};
