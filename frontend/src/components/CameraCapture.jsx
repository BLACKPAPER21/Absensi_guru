import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Load Face-API models first
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setIsModelsLoaded(true);
      } catch (err) {
        console.error('Failed to load face-api models', err);
        setError('Gagal memuat sistem AI pengenalan wajah.');
      }
    };
    loadModels();
  }, []);

  // Start camera when component mounts and models are loaded
  useEffect(() => {
    if (isModelsLoaded) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isModelsLoaded]);

  const startCamera = async () => {
    try {
      // First try to get the front camera
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
      } catch (e) {
        // Fallback to any available camera
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Kamera sedang digunakan oleh aplikasi lain.');
      } else if (err.name === 'NotAllowedError') {
        setError('Izin kamera ditolak. Mohon izinkan akses kamera di pengaturan browser Anda.');
      } else {
        setError('Tidak dapat mengakses kamera.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const takePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !isModelsLoaded) return;
    
    setIsDetecting(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // AI Face Detection Process
      const detections = await faceapi.detectAllFaces(canvas).withFaceLandmarks().withFaceDescriptors();
      
      if (detections.length === 0) {
        alert('AI Peringatan: Tidak ada wajah yang terdeteksi! Pastikan wajah Anda terlihat jelas di kamera.');
        setIsDetecting(false);
        return; // Reject capture
      } else if (detections.length > 1) {
        alert('AI Peringatan: Terdeteksi lebih dari satu wajah! Harap foto sendiri.');
        setIsDetecting(false);
        return; // Reject capture
      }

      // If exactly 1 face is detected, we proceed
      // TODO: Compare detections[0].descriptor with the teacher's registered face descriptor in DB
      console.log('Face descriptor generated:', detections[0].descriptor);

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        stopCamera();
        const descriptorArray = Array.from(detections[0].descriptor);
        onCapture(blob, JSON.stringify(descriptorArray)); // Send to parent with descriptor
      }, 'image/jpeg', 0.8);

    } catch (err) {
      console.error("AI Detection Error:", err);
      alert('Terjadi kesalahan saat memproses wajah.');
      setIsDetecting(false);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-xl">
        <div className="p-4 border-b border-surface-variant flex justify-between items-center">
          <h3 className="font-headline-sm text-on-background">Verifikasi Wajah AI</h3>
          <button onClick={handleCancel} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="relative bg-black aspect-[3/4] sm:aspect-video flex items-center justify-center">
          {!isModelsLoaded && !error ? (
            <div className="text-secondary p-4 text-center flex flex-col items-center">
              <span className="material-symbols-outlined text-4xl mb-2 animate-spin">sync</span>
              <p className="animate-pulse">Memuat Modul AI...</p>
            </div>
          ) : error ? (
            <div className="text-error p-4 text-center">
              <span className="material-symbols-outlined text-4xl mb-2">videocam_off</span>
              <p>{error}</p>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover transform scale-x-[-1]"
              ></video>
              <canvas ref={canvasRef} className="hidden"></canvas>
              
              {/* Overlay Scanner Animation when detecting */}
              {isDetecting && (
                <div className="absolute inset-0 border-4 border-secondary/50 rounded flex flex-col items-center justify-center bg-secondary/10">
                  <div className="w-full h-1 bg-secondary shadow-[0_0_15px_#006C5B] animate-scan"></div>
                  <span className="absolute bottom-4 text-white text-xs bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Memindai Wajah...</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={handleCancel}
            disabled={isDetecting}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          {!error && isModelsLoaded && (
            <button 
              onClick={takePhoto}
              disabled={isDetecting}
              className="px-5 py-2.5 rounded-lg bg-secondary text-white font-medium text-sm hover:bg-[#005a4b] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 min-w-[140px]"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDetecting ? 'hourglass_empty' : 'center_focus_strong'}
              </span>
              {isDetecting ? 'Memindai...' : 'Ambil Foto'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
