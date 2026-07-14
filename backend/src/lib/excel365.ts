// Microsoft Graph API client for Excel 365

const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

export interface ExcelFile {
  id: string;
  name: string;
  webUrl: string;
  lastModifiedDateTime: string;
  size: number;
}

export interface ExcelWorkbook {
  id: string;
  name: string;
  worksheets: ExcelWorksheet[];
}

export interface ExcelWorksheet {
  id: string;
  name: string;
  position: number;
}

export interface SheetData {
  values: any[][];
  address: string;
  rowCount: number;
  columnCount: number;
}

export class MicrosoftGraphClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${GRAPH_API_BASE}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { error?: { message?: string } };
      throw new Error(error.error?.message || `Graph API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  // Get recent Excel files from OneDrive
  async getRecentExcelFiles(): Promise<ExcelFile[]> {
    const result = await this.request<{ value: any[] }>(
      "/me/drive/recent"
    );

    return result.value.map((item: any) => ({
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
      lastModifiedDateTime: item.lastModifiedDateTime,
      size: item.size,
    }));
  }

  // List Excel files in a folder
  async listExcelFiles(folderId?: string): Promise<ExcelFile[]> {
    const endpoint = folderId
      ? `/me/drive/items/${folderId}/children?filter=fileExtension eq 'xlsx'`
      : "/me/drive/root/children?filter=fileExtension eq 'xlsx'";

    const result = await this.request<{ value: any[] }>(endpoint);

    return result.value.map((item: any) => ({
      id: item.id,
      name: item.name,
      webUrl: item.webUrl,
      lastModifiedDateTime: item.lastModifiedDateTime,
      size: item.size,
    }));
  }

  // Get workbook info
  async getWorkbook(fileId: string): Promise<ExcelWorkbook> {
    const result = await this.request<any>(`/me/drive/items/${fileId}/workbook`);

    return {
      id: result.id,
      name: result.name,
      worksheets: result.worksheets?.map((ws: any) => ({
        id: ws.id,
        name: ws.name,
        position: ws.position,
      })) || [],
    };
  }

  // Get sheet data (range of cells)
  async getSheetData(
    fileId: string,
    sheetName: string,
    range?: string
  ): Promise<SheetData> {
    const rangeParam = range ? `!${range}` : '';
    const result = await this.request<any>(
      `/me/drive/items/${fileId}/workbook/worksheets/${sheetName}/range${rangeParam}`
    );

    return {
      values: result.values || [],
      address: result.address || '',
      rowCount: result.rowCount || 0,
      columnCount: result.columnCount || 0,
    };
  }

  // Get all data from a sheet
  async getAllSheetData(fileId: string, sheetName: string): Promise<any[][]> {
    const result = await this.getSheetData(fileId, sheetName);
    return result.values;
  }

  // Download raw file bytes for XLSX.read()
  async downloadFile(fileId: string): Promise<Uint8Array> {
    const response = await fetch(`${GRAPH_API_BASE}/me/drive/items/${fileId}/content`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  // Get file metadata for change detection
  async getFileMetadata(fileId: string): Promise<{ lastModified: string; etag: string }> {
    const result = await this.request<any>(`/me/drive/items/${fileId}`);
    return {
      lastModified: result.lastModifiedDateTime,
      etag: result.eTag,
    };
  }
}

// OAuth2 — tenant from env or fallback to 'common'
function tenantUrl(path: string): string {
  const tenant = process.env.MS_TENANT_ID || 'common';
  return `https://login.microsoftonline.com/${tenant}${path}`;
}

export const MICROSOFT_AUTH = {
  scopes: ['Files.Read.All', 'User.Read'],
};

// Generate auth URL
export function getAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: MICROSOFT_AUTH.scopes.join(' '),
    state,
  });
  return `${tenantUrl('/oauth2/v2.0/authorize')}?${params.toString()}`;
}

// Exchange code for tokens
export async function exchangeCodeForTokens(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
  const response = await fetch(tenantUrl('/oauth2/v2.0/token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error_description?: string };
    throw new Error(error.error_description || 'Token exchange failed');
  }

  const data = await response.json() as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// Refresh access token
export async function refreshAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const response = await fetch(tenantUrl('/oauth2/v2.0/token'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({})) as { error_description?: string };
    throw new Error(error.error_description || 'Token refresh failed');
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}
