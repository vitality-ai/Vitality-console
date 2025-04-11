export interface ApiKey {
  id?: string;
  access_key: string;
  secret_key?: string;
  created_at: string;
  status: 'active' | 'inactive';
}

export interface ApiKeyResponse {
  access_key: string;
  secret_key: string;
  created_at: string;
  status: 'active' | 'inactive';
}

export interface ApiKeysListResponse {
  keys: ApiKey[];
} 