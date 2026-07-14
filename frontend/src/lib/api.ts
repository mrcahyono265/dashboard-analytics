const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
export const API_ORIGIN = API_BASE.replace(/\/api$/, '');

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('analitics_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('analitics_token', token);
    } else {
      localStorage.removeItem('analitics_token');
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

  // ─── Auth ───────────────────────────────────────────────
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
    region?: string;
    center?: string;
    crrName?: string;
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

  // ─── Data ───────────────────────────────────────────────
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

  async manualData(sheetType: string, period: string, data: any[]) {
    return this.request<{ message: string; recordsCount: number }>('/data/manual', {
      method: 'POST',
      body: { sheetType, period, data },
    });
  }

  async syncMaster() {
    return this.request<{ message: string; created: { users: number; assignments: number; stores: number; packages: number; events: number } }>('/data/sync-master', { method: 'POST' });
  }

  async appendData(sheetType: string, period: string, row: any) {
    return this.request<{ message: string; totalRecords: number }>('/data/append', {
      method: 'POST',
      body: { sheetType, period, row },
    });
  }

  async deleteEntry(sheetType: string, period: string, index: number) {
    return this.request<{ message: string; totalRecords: number }>('/data/entry/' + sheetType, {
      method: 'DELETE',
      body: { period, index },
    });
  }

  // ─── Users ──────────────────────────────────────────────
  async getUsers() {
    return this.request<{ users: any[] }>('/users');
  }

  async getHierarchy() {
    return this.request<{ users: any[] }>('/users/hierarchy');
  }

  async createUser(data: { username: string; password: string; confirmPassword: string; displayName: string; isAdmin?: boolean }) {
    return this.request<{ user: any }>('/users', { method: 'POST', body: data });
  }

  async updateUser(id: string, data: { displayName?: string; isAdmin?: boolean; password?: string; confirmPassword?: string }) {
    return this.request<{ user: any }>(`/users/${id}`, { method: 'PUT', body: data });
  }

  async setUserPassword(id: string, password: string, confirmPassword: string) {
    return this.request<{ message: string }>(`/users/${id}/set-password`, { method: 'POST', body: { password, confirmPassword } });
  }

  async deleteUser(id: string) {
    return this.request<{ message: string }>(`/users/${id}`, { method: 'DELETE' });
  }

  // ─── Targets ────────────────────────────────────────────
  async getTargets(period?: string, channel?: string) {
    const params = new URLSearchParams();
    if (period) params.set('period', period);
    if (channel) params.set('channel', channel);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ targets: any[] }>(`/targets${query}`);
  }

  async createTarget(channel: string, targetValue: number, period: string, center?: string, staffName?: string) {
    return this.request<{ target: any }>('/targets', {
      method: 'POST',
      body: { channel, targetValue, period, center, staffName },
    });
  }

  async deleteTarget(id: number) {
    return this.request<{ message: string }>(`/targets/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkTargets(period: string, targets: { channel: string; targetValue: number; center?: string }[]) {
    return this.request<{ targets: any[] }>('/targets/bulk', {
      method: 'POST',
      body: { period, targets },
    });
  }

  // ─── Profile ──────────────────────────────────────────────
  async updateProfile(data: { displayName?: string; username?: string; email?: string; phone?: string; currentPassword?: string }) {
    return this.request<{ user: any; token?: string }>('/auth/profile', {
      method: 'PATCH',
      body: data,
    });
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);
    const config: RequestInit = {
      method: 'POST',
      body: formData,
    };
    if (this.token) {
      config.headers = { 'Authorization': `Bearer ${this.token}` };
    }
    const response = await fetch(`${API_BASE}/auth/avatar`, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json() as Promise<{ avatarUrl: string }>;
  }

  async deleteAvatar() {
    return this.request<{ message: string }>('/auth/avatar', { method: 'DELETE' });
  }

  // ─── Sync (Excel 365) ───────────────────────────────────
  async triggerSync(fileId: string, period?: string) {
    return this.request('/sync/excel365', {
      method: 'POST',
      body: { fileId, period },
    });
  }

  async getSyncStatus() {
    return this.request<{ connected: boolean; active: boolean; fileId: string | null; account: { displayName: string; email: string } | null; recentSyncs: any[] }>('/sync/status');
  }

  async syncConnect() {
    return this.request<{ authUrl: string }>('/sync/connect', {
      method: 'POST',
    });
  }

  async syncStart(fileId: string) {
    return this.request<{ message: string; fileId: string }>('/sync/start', {
      method: 'POST',
      body: { fileId },
    });
  }

  async syncStop() {
    return this.request<{ message: string }>('/sync/stop', {
      method: 'POST',
    });
  }

  async syncDisconnect() {
    return this.request<{ message: string }>('/sync/disconnect', {
      method: 'POST',
    });
  }

  async getSyncFiles() {
    return this.request<{ files: any[]; limitedLicense?: boolean }>('/sync/files');
  }

  async syncFromUrl(url: string, period?: string) {
    return this.request<{ message: string; recordsCount: number; sheets: any[] }>('/sync/url', {
      method: 'POST',
      body: { url, period },
    });
  }

  async syncFromUrlPreview(url: string) {
    return this.request<{ message: string; totalRecords: number; sheets: { sheetName: string; recordsCount: number }[] }>('/sync/url', {
      method: 'POST',
      body: { url, preview: true },
    });
  }

  async startUrlAutoSync(url: string) {
    return this.request<{ message: string; interval: string }>('/sync/url/start', {
      method: 'POST',
      body: { url },
    });
  }

  async stopUrlAutoSync() {
    return this.request<{ message: string }>('/sync/url/stop', {
      method: 'POST',
    });
  }

  async downloadSyncExcel() {
    const response = await fetch(`${API_BASE}/sync/download`, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  }

  // ─── Stores ───────────────────────────────────────────────
  async getStores() {
    return this.request<{ stores: any[] }>('/stores');
  }

  async createStore(data: { name: string; channel: string; region?: string }) {
    return this.request<{ store: any }>('/stores', { method: 'POST', body: data });
  }

  async updateStore(id: string, data: { name?: string; channel?: string; region?: string | null }) {
    return this.request<{ store: any }>(`/stores/${id}`, { method: 'PUT', body: data });
  }

  async deleteStore(id: string) {
    return this.request<{ message: string }>(`/stores/${id}`, { method: 'DELETE' });
  }

  // ─── Packages ─────────────────────────────────────────────
  async getPackages() {
    return this.request<{ packages: any[] }>('/packages');
  }

  async createPackage(data: { name: string; channel: string; category?: string }) {
    return this.request<{ package: any }>('/packages', { method: 'POST', body: data });
  }

  async updatePackage(id: string, data: { name?: string; channel?: string; category?: string | null }) {
    return this.request<{ package: any }>(`/packages/${id}`, { method: 'PUT', body: data });
  }

  async deletePackage(id: string) {
    return this.request<{ message: string }>(`/packages/${id}`, { method: 'DELETE' });
  }

  // ─── User Assignments ──────────────────────────────────────
  async getUserAssignments(params?: { userId?: string; store?: string; channel?: string; roleType?: string }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request<{ assignments: any[] }>(`/user-assignments${query}`);
  }

  async createUserAssignment(data: { userId: string; channel: string; storeName: string; roleType: string; usernameAgent?: string | null }) {
    return this.request<{ assignment: any }>('/user-assignments', { method: 'POST', body: data });
  }

  async updateUserAssignment(id: string, data: { channel?: string; storeName?: string; roleType?: string; usernameAgent?: string | null }) {
    return this.request<{ assignment: any }>(`/user-assignments/${id}`, { method: 'PUT', body: data });
  }

  async deleteUserAssignment(id: string) {
    return this.request<{ message: string }>(`/user-assignments/${id}`, { method: 'DELETE' });
  }

  // ─── Event Types ──────────────────────────────────────────
  async getEventTypes() {
    return this.request<{ events: any[] }>('/event-types');
  }

  async createEventType(data: { name: string }) {
    return this.request<{ event: any }>('/event-types', { method: 'POST', body: data });
  }

  async updateEventType(id: string, data: { name: string }) {
    return this.request<{ event: any }>(`/event-types/${id}`, { method: 'PUT', body: data });
  }

  async deleteEventType(id: string) {
    return this.request<{ message: string }>(`/event-types/${id}`, { method: 'DELETE' });
  }

  // ─── Source switch ────────────────────────────────────────
  async getActiveSource() {
    return this.request<{ activeSource: string; sourceFileName: string | null }>('/data/active-source');
  }

  async switchSource(source: 'upload' | 'url' | 'excel365', opts?: { sourceFileName?: string; url?: string; fileId?: string }) {
    return this.request<{ message: string; activeSource: string; sheets: { sheetType: string; recordsCount: number }[] }>('/data/switch-source', {
      method: 'POST',
      body: { source, ...opts },
    });
  }

  async getPeriods() {
    return this.request<{ periods: string[]; records: any[] }>('/data/periods');
  }

  async getDataWithCategory(sheetType: string, category?: string, period?: string) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (period) params.set('period', period);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{ data: any; period: string | null; category?: string; sheetType?: string }>(`/data/${sheetType}${query}`);
  }

  async getAllDataWithCategory(category?: string, period?: string) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (period) params.set('period', period);
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Record<string, any>>(`/data${query}`);
  }
}

export const api = new ApiClient();
export default api;
