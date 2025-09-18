// frontend/src/pages/upload/VideoUploadPage.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { videoService } from '../../services/video.services';
import { coachService } from '../../../apps/coach/src/services/coach.service';
import LoadingSpinner from '../../components/LoadingSpinner';

const VideoUploadPage: React.FC = () => {
  const { isCoach } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [uploadStartTime, setUploadStartTime] = useState<number>(0);
  // const [bytesUploaded, setBytesUploaded] = useState<number>(0);
  
  // For coaches - athlete selection
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState('');
  const [uploadingFor, setUploadingFor] = useState<'self' | 'athlete'>('self');
  
  // Notes field
  const [notes, setNotes] = useState('');

  // Animation states
  const [isHovering, setIsHovering] = useState(false);

  // Load athletes if user is a coach
  useEffect(() => {
    if (isCoach) {
      loadAthletes();
    }
  }, [isCoach]);

  // Cleanup video preview URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const loadAthletes = async () => {
    try {
      const data = await coachService.getAthletes();
      setAthletes(data);
    } catch (error) {
      console.error('Failed to load athletes:', error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    setError('');
    
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Please select a valid video file (MP4, MOV, AVI, or MKV)');
      return;
    }
    
    // Validate file size (500MB limit)
    const maxSize = 500 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size must be less than 500MB');
      return;
    }
    
    setFile(selectedFile);
    
    // Create video preview
    const url = URL.createObjectURL(selectedFile);
    setVideoPreviewUrl(url);
    
    // Get video duration
    const video = document.createElement('video');
    video.src = url;
    video.onloadedmetadata = () => {
      setVideoDuration(video.duration);
    };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const calculateUploadMetrics = (progress: number) => {
    if (uploadStartTime === 0) return;
    
    const currentTime = Date.now();
    const elapsedTime = (currentTime - uploadStartTime) / 1000; // in seconds
    const currentBytes = (file?.size || 0) * (progress / 100);
    const speed = currentBytes / elapsedTime; // bytes per second
    
    // Format speed
    if (speed > 1024 * 1024) {
      setUploadSpeed(`${(speed / (1024 * 1024)).toFixed(2)} MB/s`);
    } else if (speed > 1024) {
      setUploadSpeed(`${(speed / 1024).toFixed(2)} KB/s`);
    } else {
      setUploadSpeed(`${speed.toFixed(0)} B/s`);
    }
    
    // Calculate time remaining
    if (progress > 0 && progress < 100) {
      const remainingBytes = (file?.size || 0) - currentBytes;
      const remainingSeconds = remainingBytes / speed;
      
      if (remainingSeconds < 60) {
        setTimeRemaining(`${Math.ceil(remainingSeconds)}s remaining`);
      } else {
        setTimeRemaining(`${Math.ceil(remainingSeconds / 60)}m remaining`);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (isCoach && uploadingFor === 'athlete' && !selectedAthleteId) {
      setError('Please select an athlete');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);
    setUploadStartTime(Date.now());

    try {
      // Step 1: Get presigned URL
      setUploadProgress(5);
      const { uploadUrl, key } = await videoService.getPresignedUploadUrl(
        file.name,
        file.type
      );

      // Step 2: Upload to S3 with progress tracking
      setUploadProgress(10);
      
      // Simulate progress for now (in production, you'd use XMLHttpRequest for real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + 10, 90);
          calculateUploadMetrics(newProgress);
          return newProgress;
        });
      }, 500);

      await videoService.uploadToS3(uploadUrl, file);
      clearInterval(progressInterval);
      setUploadProgress(95);

      // Step 3: Confirm upload
      const athleteId = uploadingFor === 'athlete' ? selectedAthleteId : undefined;
      await videoService.confirmUpload(key, athleteId, notes);
      setUploadProgress(100);

      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        if (isCoach) {
          navigate('/coach');
        } else {
          navigate('/dashboard');
        }
      }, 3000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload video');
      setUploadProgress(0);
      setUploadSpeed('');
      setTimeRemaining('');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-4xl font-display font-bold text-neutral-900 mb-3">
            Upload Running Video
          </h1>
          <p className="text-lg text-neutral-600">
            Get AI-powered biomechanical analysis in minutes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Upload Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Message */}
            {success && (
              <div className="card-luxury bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 animate-slide-down">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-green-900">Upload Successful!</h3>
                    <p className="mt-1 text-green-700">Your video has been uploaded and is being processed.</p>
                    <p className="mt-2 text-sm text-green-600">Redirecting to dashboard...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Coach Options */}
            {isCoach && !success && (
              <div className="card-luxury animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Upload For</h3>
                <div className="space-y-3">
                  <label className="flex items-center cursor-pointer p-3 rounded-xl hover:bg-neutral-50 transition-colors">
                    <input
                      type="radio"
                      name="uploadFor"
                      value="self"
                      checked={uploadingFor === 'self'}
                      onChange={(e) => setUploadingFor(e.target.value as 'self' | 'athlete')}
                      className="mr-3 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-neutral-700">Myself</span>
                  </label>
                  <label className="flex items-center cursor-pointer p-3 rounded-xl hover:bg-neutral-50 transition-colors">
                    <input
                      type="radio"
                      name="uploadFor"
                      value="athlete"
                      checked={uploadingFor === 'athlete'}
                      onChange={(e) => setUploadingFor(e.target.value as 'self' | 'athlete')}
                      className="mr-3 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-neutral-700">One of my athletes</span>
                  </label>
                </div>
                
                {uploadingFor === 'athlete' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Select Athlete
                    </label>
                    <select
                      value={selectedAthleteId}
                      onChange={(e) => setSelectedAthleteId(e.target.value)}
                      className="input-modern w-full"
                    >
                      <option value="">Choose an athlete...</option>
                      {athletes.map((athlete) => (
                        <option key={athlete.id} value={athlete.id}>
                          {athlete.firstName} {athlete.lastName} - {athlete.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Upload Area */}
            {!success && (
              <div className="card-luxury animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {/* Drop Zone */}
                {!file ? (
                  <div
                    className={`relative border-3 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                      dragActive 
                        ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-green-50 scale-[1.02]' 
                        : isHovering
                        ? 'border-primary-400 bg-gradient-to-br from-neutral-50 to-primary-50/30'
                        : 'border-neutral-300 hover:border-primary-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={uploading}
                    />
                    
                    <div className={`transition-transform duration-300 ${dragActive ? 'scale-110' : ''}`}>
                      <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-green-400 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl animate-float">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-semibold text-neutral-900 mb-2">
                        {dragActive ? 'Drop your video here!' : 'Drag & Drop your video'}
                      </h3>
                      <p className="text-neutral-600 mb-6">or</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-luxury group"
                        disabled={uploading}
                      >
                        <span className="flex items-center">
                          <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          Browse Files
                        </span>
                      </button>
                      <p className="text-sm text-neutral-500 mt-6">
                        Supported: MP4, MOV, AVI, MKV • Max 500MB • Best quality: 1080p @ 30fps
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Video Preview */}
                    {videoPreviewUrl && (
                      <div className="relative rounded-xl overflow-hidden bg-black">
                        <video
                          ref={videoPreviewRef}
                          src={videoPreviewUrl}
                          controls
                          className="w-full max-h-96 object-contain"
                        />
                        {!uploading && (
                          <button
                            onClick={() => {
                              setFile(null);
                              setVideoPreviewUrl(null);
                              setVideoDuration(0);
                            }}
                            className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}

                    {/* File Info */}
                    <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-green-100 rounded-xl flex items-center justify-center mr-4">
                            <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900">{file.name}</p>
                            <p className="text-sm text-neutral-600">
                              {formatFileSize(file.size)} • {videoDuration > 0 && `${formatDuration(videoDuration)} • `}
                              {file.type.split('/')[1].toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700">Uploading...</span>
                          <span className="text-sm font-bold text-primary-600">{uploadProgress}%</span>
                        </div>
                        <div className="relative">
                          <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary-400 to-green-400 rounded-full transition-all duration-500 relative overflow-hidden"
                              style={{ width: `${uploadProgress}%` }}
                            >
                              <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-neutral-600">
                          <span>{uploadSpeed}</span>
                          <span>{timeRemaining}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Notes Field */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any context about this video (e.g., running pace, distance, any specific concerns)..."
                    className="input-modern w-full h-24 resize-none"
                    disabled={uploading}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    onClick={() => navigate(-1)}
                    className="btn-secondary"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    className="btn-luxury flex items-center min-w-[150px] justify-center"
                    disabled={!file || uploading}
                  >
                    {uploading ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        <span className="ml-2">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Start Upload
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tips Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recording Tips */}
            <div className="card-luxury animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">Recording Tips</h3>
              </div>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Record from the side view for best analysis</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Keep camera steady at hip height</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Include at least 10-15 strides</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Good lighting (outdoor or bright indoor)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Wear fitted clothing for accurate analysis</span>
                </li>
              </ul>
            </div>

            {/* What Happens Next */}
            <div className="card-luxury animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900">What Happens Next</h3>
              </div>
              <ol className="space-y-3 text-sm text-neutral-600">
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold mr-2">1</span>
                  <span>Video uploads to secure cloud storage</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold mr-2">2</span>
                  <span>AI analyzes your running biomechanics</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold mr-2">3</span>
                  <span>Detailed report generated in 2-5 minutes</span>
                </li>
                <li className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold mr-2">4</span>
                  <span>Get personalized recommendations</span>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoUploadPage;