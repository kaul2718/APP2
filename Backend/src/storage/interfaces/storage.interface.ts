export interface UploadResult {
  storageKey: string;
  size: number;
  mimeType: string;
}

export interface PresignedUploadResult {
  uploadUrl: string;
  storageKey: string;
  expiresIn: number;
}

export interface IStorageService {
  uploadFile(
    key: string,
    buffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>,
  ): Promise<UploadResult>;

  getPresignedUrl(key: string, expiresInSeconds?: number): Promise<string>;

  getPresignedUploadUrl(
    key: string,
    mimeType: string,
    expiresInSeconds?: number,
  ): Promise<PresignedUploadResult>;

  deleteFile(key: string): Promise<void>;

  checkObjectExists(key: string): Promise<boolean>;
  getObjectMetadata(key: string): Promise<{ size: number; mimeType?: string } | null>;
  getFileBuffer(key: string): Promise<Buffer>;
}
