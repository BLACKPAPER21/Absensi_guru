import React, { useRef, useState, useEffect } from 'react';

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      // First try to get the front camera
      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' } 
        });
      } catch (e) {
        // Fallback to any available camera if facingMode constraint fails
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
        setError('Camera is currently in use by another application (like a video call). Please turn off your camera there first.');
      } else if (err.name === 'NotAllowedError') {
        setError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera was found on your device.');
      } else {
        setError('Could not access camera. Please check your permissions.');
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        // Stop camera and pass blob to parent
        stopCamera();
        onCapture(blob);
      }, 'image/jpeg', 0.8);
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
          <h3 className="font-headline-sm text-on-background">Take Attendance Photo</h3>
          <button onClick={handleCancel} className="text-on-surface-variant hover:text-error transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="relative bg-black aspect-[3/4] sm:aspect-video flex items-center justify-center">
          {error ? (
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
                className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect for front camera
              ></video>
              <canvas ref={canvasRef} className="hidden"></canvas>
            </>
          )}
        </div>

        <div className="p-4 bg-surface-container flex justify-center gap-4">
          <button 
            onClick={handleCancel}
            className="px-6 py-2 rounded-full border border-outline text-on-surface font-label-md hover:bg-surface-variant transition-colors"
          >
            Cancel
          </button>
          {!error && (
            <button 
              onClick={takePhoto}
              className="px-6 py-2 rounded-full bg-secondary text-on-secondary font-label-md hover:bg-on-secondary-container transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">photo_camera</span>
              Capture
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
