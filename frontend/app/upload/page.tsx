"use client";
import Header from '@/components/Header';
import UploadZone from '@/components/UploadZone';
import ProgressBar from '@/components/ProgressBar';
import { useState, useEffect } from 'react';
import { mediaService } from '@/lib/services/media.service';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function UploadPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [tags, setTags] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    setIsUploading(true);
    setStatus('Uploading...');
    setProgress(10);
    setUploadedFiles([]);

    try {
      const uploaded = [];
      for (let i = 0; i < files.length; i++) {
        const result = await mediaService.upload({
          file: files[i],
          visibility,
          tags,
          title: files[i].name,
        });
        uploaded.push(result);
        setUploadedFiles([...uploaded]);
        setProgress(Math.min(90, Math.round(((i + 1) / files.length) * 90)));
      }
      setProgress(100);
      setStatus(`Upload complete! ${uploaded.length} file(s) uploaded successfully.`);
      setTimeout(() => {
        router.push('/library');
      }, 2000);
    } catch (e: any) {
      console.error(e);
      setStatus(`Upload failed: ${e.message || 'Please try again.'}`);
      setProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative bg-gray-950 min-h-screen flex flex-col overflow-hidden">
      {/* Premium Animated Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-500/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      <Header />
      
      <main className="relative flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Optimized Grid Layout - No empty spaces */}
          <div className="space-y-4">
            
            {/* Hero Header - Full width */}
            <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-900/95 to-gray-900 border border-gray-800/50 p-8 lg:p-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl" />
                
                <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="text-center lg:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-4">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-blue-300">Ready to Upload</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent mb-3">
                      Upload Your Media
                    </h1>
                    <p className="text-gray-400 text-lg">
                      Drag, drop, and share your creative work with the world
                    </p>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="text-center px-6 py-4 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                      <div className="text-3xl font-bold bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        100MB
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Max Size</div>
                    </div>
                    <div className="text-center px-6 py-4 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50">
                      <div className="text-3xl font-bold bg-gradient-to-br from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        ∞
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Files</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Visibility and Tags - Side by side at top */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Visibility Card */}
              <div className={`transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} flex`}>
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 w-full flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    Visibility
                  </h3>
                  
                  <div className="space-y-3 flex-grow">
                    <button
                      onClick={() => setVisibility('private')}
                      className={`w-full group relative overflow-hidden flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                        visibility === 'private'
                          ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        visibility === 'private' ? 'border-blue-500' : 'border-gray-600'
                      }`}>
                        {visibility === 'private' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">🔒</span>
                          <span className={`font-bold text-sm ${visibility === 'private' ? 'text-white' : 'text-gray-400'}`}>
                            Private
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Only visible to you. Perfect for personal collections.</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setVisibility('public')}
                      className={`w-full group relative overflow-hidden flex items-start gap-3 p-4 rounded-xl border-2 transition-all ${
                        visibility === 'public'
                          ? 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'bg-gray-800/30 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        visibility === 'public' ? 'border-blue-500' : 'border-gray-600'
                      }`}>
                        {visibility === 'public' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">🌐</span>
                          <span className={`font-bold text-sm ${visibility === 'public' ? 'text-white' : 'text-gray-400'}`}>
                            Public
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Share with everyone. Great for portfolios.</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tags Card */}
              <div className={`transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} flex`}>
                <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6 w-full flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    Tags
                  </h3>
                  <div className="flex-grow flex flex-col">
                    <input
                      type="text"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="nature, sunset, vacation..."
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-3">Separate tags with commas</p>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs text-purple-300">
                        #photography
                      </span>
                      <span className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-300">
                        #nature
                      </span>
                      <span className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-300">
                        #travel
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Zone - Full width below */}
            <div className={`transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="h-full min-h-[400px]">
                <UploadZone onFilesSelected={handleFiles} />
              </div>
            </div>

            {/* Progress Card - Full width below upload zone */}
            {(progress > 0 || status) && (
              <div className={`transition-all duration-700 delay-250 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className="relative overflow-hidden bg-gray-900/50 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-6">
                  {isUploading && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-indigo-500/5 animate-pulse" />
                  )}
                  
                  <div className="relative">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                          {isUploading ? (
                            <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : (
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white">Upload Progress</h3>
                          <p className="text-sm text-gray-400">
                            {isUploading ? 'Processing your files...' : 'Ready'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                          {progress}%
                        </div>
                      </div>
                    </div>
                    
                    <ProgressBar progress={progress} />
                    
                    {status && (
                      <div className={`mt-6 p-5 rounded-xl border-2 ${
                        status.includes('complete') 
                          ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/50' 
                          : status.includes('failed')
                          ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/50'
                          : 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/50'
                      }`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            status.includes('complete') 
                              ? 'bg-green-500/20' 
                              : status.includes('failed')
                              ? 'bg-red-500/20'
                              : 'bg-blue-500/20'
                          }`}>
                            {status.includes('complete') ? (
                              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : status.includes('failed') ? (
                              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={`font-bold text-lg ${
                              status.includes('complete') 
                                ? 'text-green-300' 
                                : status.includes('failed')
                                ? 'text-red-300'
                                : 'text-blue-300'
                            }`}>
                              {status}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {uploadedFiles.length > 0 && (
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-green-500/30 transition-all">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{file.filename || `File ${index + 1}`}</p>
                            </div>
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Info Cards - Three equal columns at bottom */}
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Supported Formats</h4>
                    <p className="text-sm text-gray-300">JPG, PNG, GIF, WebP, MP4, MOV, AVI</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Max File Size</h4>
                    <p className="text-sm text-gray-300">100 MB per file for optimal performance</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Batch Upload</h4>
                    <p className="text-sm text-gray-300">Upload multiple files at once effortlessly</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}