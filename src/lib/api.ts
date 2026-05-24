const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  get: async (url: string) => {
    const res = await fetch(BASE_URL + url);
    return res.json();
  },

  post: async (url: string, data: any) => {
    const res = await fetch(BASE_URL + url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
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
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.message || `HTTP error ${res.status}`);
    }
    return res.json();
  },
};