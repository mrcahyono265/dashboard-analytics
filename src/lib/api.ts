const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('prio_dashboard_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('prio_dashboard_token', token);
    } else {
      localStorage.removeItem('prio_dashboard_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (this.token) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async uploadFile<T = any>(endpoint: string, file: File, additionalData?: Record<string, string>): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const config: RequestInit = {
      method: 'POST',
      body: formData,
    };

    if (this.token) {
      config.headers = {
        'Authorization': `Bearer ${this.token}`,
      };
    }

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string) {
    const result = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    this.setToken(result.token);
    return result;
  }

  async register(data: {
    username: string;
    password: string;
    displayName: string;
    role?: string;
    rsm?: string;
    sm?: string;
    storeName?: string;
  }) {
    const result = await this.request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: data,
    });
    this.setToken(result.token);
    return result;
  }

  async getMe() {
    return this.request<{ user: any }>('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Data
  async getData(sheetType: string, period?: string) {
    const query = period ? `?period=${period}` : '';
    return this.request<{ data: any; period: string; source: string }>(`/data/${sheetType}${query}`);
  }

  async getAllData(period?: string) {
    const query = period ? `?period=${period}` : '';
    return this.request<Record<string, any>>(`/data${query}`);
  }

  async uploadExcel(file: File, period?: string) {
    return this.uploadFile<{ message: string; period: string; sheets: any[] }>('/data/upload', file, period ? { period } : undefined);
  }

  async getStats(period?: string) {
    const query = period ? `?period=${period}` : '';
    return this.request<{ stats: any }>(`/data/overview/stats${query}`);
  }

  // Users (admin)
  async getUsers() {
    return this.request<{ users: any[] }>('/users');
  }

  async createUser(data: any) {
    return this.request<{ user: any }>('/users', {
      method: 'POST',
      body: data,
    });
  }

  async updateUser(id: string, data: any) {
    return this.request<{ user: any }>(`/users/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Sync
  async triggerSync(fileId: string, period?: string) {
    return this.request('/sync/excel365', {
      method: 'POST',
      body: { fileId, period },
    });
  }

  async getSyncStatus() {
    return this.request<{ syncs: any[] }>('/sync/status');
  }
}

export const api = new ApiClient();
export default api;
