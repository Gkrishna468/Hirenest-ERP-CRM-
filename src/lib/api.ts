import { auth } from '@/services/firebase/config';

export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  let token = '';
  const execSession = typeof localStorage !== 'undefined' ? localStorage.getItem('hirenest_exec_session') : null;
  
  if (execSession) {
    token = 'executive-bypass-token';
  } else if (auth?.currentUser) {
    try {
      token = await auth.currentUser.getIdToken(false);
      if (token && typeof localStorage !== 'undefined') {
        localStorage.setItem('fb_token', token);
      }
    } catch (err) {
      console.warn("[apiFetch] getIdToken failed, falling back to cached token:", err);
      token = (typeof localStorage !== 'undefined' ? localStorage.getItem('fb_token') : '') || '';
    }
  } else {
    token = (typeof localStorage !== 'undefined' ? localStorage.getItem('fb_token') : '') || '';
  }

  const headers: Record<string, string> = {
    ...(options?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options?.headers as Record<string, string> || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;

  let res: Response;
  try {
    res = await fetch(fullUrl, { ...options, headers });
  } catch (fetchErr) {
    console.warn(`[apiFetch] Fetch failed for ${fullUrl}, retrying...`, fetchErr);
    await new Promise(r => setTimeout(r, 300));
    try {
      res = await fetch(fullUrl, { ...options, headers });
    } catch (retryErr) {
      console.error(`[apiFetch] Network error for ${fullUrl}:`, retryErr);
      throw retryErr;
    }
  }

  if (!res.ok) {
    if (res.status === 404) {
      return res; // Graceful handling for 404s
    }
    const errData = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(errData.error || errData.message || `API request failed with status ${res.status}`);
  }

  return res;
}
