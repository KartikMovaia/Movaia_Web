// frontend/src/services/video.service.ts

import { apiService } from './api.service';

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  expires: string;
}

export interface ConfirmUploadResponse {
  message: string;
  analysis: {
    id: string;
    userId: string;
    videoUrl: string;
    videoFileName: string;
    status: string;
    createdAt: string;
  };
}

class VideoService {
  /**
   * Get presigned URL for direct S3 upload
   */
  async getPresignedUploadUrl(
    fileName: string,
    fileType: string
  ): Promise<PresignedUrlResponse> {
    const response = await apiService.post<PresignedUrlResponse>(
      '/videos/upload-url',
      {
        fileName,
        fileType
      }
    );
    return response.data;
  }

  /**
   * Upload directly to S3 using presigned URL
   */
  async uploadToS3(url: string, file: File): Promise<void> {
    const response = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('S3 upload error:', errorText);
      throw new Error('Failed to upload to S3');
    }
  }

  /**
   * Confirm upload completion
   */
  async confirmUpload(
    key: string,
    athleteId?: string,
    notes?: string,
    tags?: string[]
  ): Promise<ConfirmUploadResponse> {
    const response = await apiService.post<ConfirmUploadResponse>(
      '/videos/confirm-upload',
      {
        key,
        athleteId,
        notes,
        tags
      }
    );
    return response.data;
  }

  /**
   * Get user's analyses
   */
  async getUserAnalyses(
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<any> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (status) {
      params.append('status', status);
    }

    const response = await apiService.get(`/videos/analyses?${params.toString()}`);
    return response.data;
  }

  /**
   * Delete analysis
   */
  async deleteAnalysis(analysisId: string): Promise<void> {
    await apiService.delete(`/videos/analysis/${analysisId}`);
  }
}

export const videoService = new VideoService();