const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  getHeaders: () => {
    const token = localStorage.getItem("erp_auth_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  },

  get: async (url: string) => {
    const res = await fetch(BASE_URL + url, {
      headers: api.getHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.message || `Access Denied (${res.status})`);
      }
    }
    return res.json();
  },

  post: async (url: string, data: any) => {
    const res = await fetch(BASE_URL + url, {
      method: "POST",
      headers: api.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  patch: async (url: string, data: any) => {
    const res = await fetch(BASE_URL + url, {
      method: "PATCH",
      headers: api.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  put: async (url: string, data: any) => {
    const res = await fetch(BASE_URL + url, {
      method: "PUT",
      headers: api.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error ${res.status}`);
    }
    return res.json();
  },

  delete: async (url: string, data?: any) => {
    const res = await fetch(BASE_URL + url, {
      method: "DELETE",
      headers: api.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error ${res.status}`);
    }
    return res.json();
  },
};