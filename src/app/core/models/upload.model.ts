/** `POST uploads/signature/`'s `folder` request field — see docs/API.md. */
export type UploadFolder = 'restaurants' | 'menu-items' | 'avatars';

/** Raw shape as returned by `POST uploads/signature/`. Internal to `CloudinaryUploadService` — never exposed further. */
export interface UploadSignatureDto {
  readonly signature: string;
  readonly timestamp: number;
  readonly api_key: string;
  readonly cloud_name: string;
  readonly folder: string;
}
