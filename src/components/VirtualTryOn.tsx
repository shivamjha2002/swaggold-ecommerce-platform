import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RotateCcw, Download, Loader } from 'lucide-react';

interface VirtualTryOnProps {
    productImage: string;
    productName: string;
    productCategory: string;
    onClose: () => void;
}

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({
    productImage,
    productName,
    productCategory,
    onClose
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);

    // Jewelry positioning based on category
    const getJewelryPosition = (category: string) => {
        const cat = category.toLowerCase();
        if (cat.includes('necklace') || cat.includes('haar')) {
            return { x: 0.5, y: 0.65, scale: 0.4 }; // Neck area
        } else if (cat.includes('earring') || cat.includes('jhumka')) {
            return { x: 0.5, y: 0.35, scale: 0.15 }; // Ear area
        } else if (cat.includes('ring')) {
            return { x: 0.5, y: 0.8, scale: 0.2 }; // Hand area
        } else if (cat.includes('bangle') || cat.includes('bracelet')) {
            return { x: 0.5, y: 0.75, scale: 0.25 }; // Wrist area
        } else if (cat.includes('maang') || cat.includes('tikka')) {
            return { x: 0.5, y: 0.15, scale: 0.15 }; // Forehead area
        }
        return { x: 0.5, y: 0.5, scale: 0.3 }; // Default center
    };

    const position = getJewelryPosition(productCategory);

    // Start camera
    const startCamera = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsLoading(false);
                    setIsCameraActive(true);
                };
            }

            setStream(mediaStream);
        } catch (err) {
            console.error('Camera access error:', err);
            setError('Camera access denied. Please allow camera permission.');
            setIsLoading(false);
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsCameraActive(false);
        }
    };

    // Draw jewelry overlay
    const drawOverlay = () => {
        if (!videoRef.current || !overlayCanvasRef.current || !isCameraActive) return;

        const video = videoRef.current;
        const canvas = overlayCanvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Load and draw jewelry image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = productImage;

        img.onload = () => {
            const jewelryWidth = canvas.width * position.scale;
            const jewelryHeight = (img.height / img.width) * jewelryWidth;
            const x = canvas.width * position.x - jewelryWidth / 2;
            const y = canvas.height * position.y - jewelryHeight / 2;

            // Add slight transparency for realistic look
            ctx.globalAlpha = 0.9;
            ctx.drawImage(img, x, y, jewelryWidth, jewelryHeight);
            ctx.globalAlpha = 1.0;
        };

        // Continue animation
        requestAnimationFrame(drawOverlay);
    };

    // Capture photo
    const capturePhoto = () => {
        if (!videoRef.current || !overlayCanvasRef.current) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const video = videoRef.current;
        const overlayCanvas = overlayCanvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Draw jewelry overlay
        ctx.drawImage(overlayCanvas, 0, 0, canvas.width, canvas.height);

        // Convert to image
        const imageData = canvas.toDataURL('image/png');
        setCapturedImage(imageData);
    };

    // Download captured image
    const downloadImage = () => {
        if (!capturedImage) return;

        const link = document.createElement('a');
        link.download = `${productName.replace(/\s+/g, '_')}_virtual_tryon.png`;
        link.href = capturedImage;
        link.click();
    };

    // Reset to camera view
    const resetCapture = () => {
        setCapturedImage(null);
    };

    // Initialize camera on mount
    useEffect(() => {
        startCamera();

        return () => {
            stopCamera();
        };
    }, []);

    // Start overlay drawing when camera is active
    useEffect(() => {
        if (isCameraActive) {
            drawOverlay();
        }
    }, [isCameraActive, productImage]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
            <div className="relative w-full h-full max-w-4xl mx-auto p-4">
                {/* Header */}
                <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                    <div className="bg-black bg-opacity-70 rounded-lg px-4 py-2">
                        <h3 className="text-white font-semibold">{productName}</h3>
                        <p className="text-gray-300 text-sm">Virtual Try-On</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-black bg-opacity-70 text-white p-2 rounded-full hover:bg-opacity-90 transition-all"
                        aria-label="Close"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="relative w-full h-full flex items-center justify-center">
                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-20">
                            <Loader className="h-12 w-12 text-yellow-400 animate-spin mb-4" />
                            <p className="text-white text-lg">Starting camera...</p>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-20">
                            <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-6 max-w-md">
                                <p className="text-white text-center mb-4">{error}</p>
                                <button
                                    onClick={startCamera}
                                    className="w-full bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg hover:bg-yellow-600 transition-all"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}

                    {capturedImage ? (
                        // Show captured image
                        <div className="relative w-full h-full flex items-center justify-center">
                            <img
                                src={capturedImage}
                                alt="Captured"
                                className="max-w-full max-h-full object-contain rounded-lg"
                            />
                        </div>
                    ) : (
                        // Show live camera feed
                        <div className="relative w-full h-full flex items-center justify-center">
                            <div className="relative max-w-full max-h-full">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="max-w-full max-h-full object-contain rounded-lg"
                                />
                                <canvas
                                    ref={overlayCanvasRef}
                                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Hidden canvas for capture */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Controls */}
                <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center space-x-4 z-10">
                    {capturedImage ? (
                        <>
                            <button
                                onClick={resetCapture}
                                className="bg-gray-700 text-white p-4 rounded-full hover:bg-gray-600 transition-all shadow-lg"
                                aria-label="Retake"
                            >
                                <RotateCcw className="h-6 w-6" />
                            </button>
                            <button
                                onClick={downloadImage}
                                className="bg-yellow-500 text-black p-4 rounded-full hover:bg-yellow-600 transition-all shadow-lg"
                                aria-label="Download"
                            >
                                <Download className="h-6 w-6" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={capturePhoto}
                            disabled={!isCameraActive}
                            className="bg-yellow-500 text-black p-6 rounded-full hover:bg-yellow-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Capture Photo"
                        >
                            <Camera className="h-8 w-8" />
                        </button>
                    )}
                </div>

                {/* Tips */}
                {!capturedImage && isCameraActive && (
                    <div className="absolute bottom-24 left-0 right-0 flex justify-center z-10">
                        <div className="bg-black bg-opacity-70 rounded-lg px-6 py-3 max-w-md">
                            <p className="text-white text-sm text-center">
                                💡 Tips: Ensure good lighting and keep your face centered
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
