import { useRef, useState, useCallback, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

const LAYOUTS = [
  {
    id: "4x1",
    name: "4x1 Strip",
    preview: "▬▬▬▬",
    description: "4 photos vertical",
    layout: { rows: 4, cols: 1 },
    icon: "📱"
  },
  {
    id: "4x2", 
    name: "4x2 Grid",
    preview: "⊞⊞",
    description: "8 photos grid",
    layout: { rows: 4, cols: 2 },
    icon: "🖼️"
  },
  {
    id: "2x2",
    name: "2x2 Grid", 
    preview: "⊞",
    description: "4 photos square",
    layout: { rows: 2, cols: 2 },
    icon: "🔲"
  },
  {
    id: "3x2",
    name: "3x2 Grid",
    preview: "⊞⊞⊞",
    description: "6 photos wide",
    layout: { rows: 3, cols: 2 },
    icon: "📐"
  }
];

const FILTERS = [
  { name: "Original", value: "", style: "", icon: "📷" },
  { name: "B&W", value: "grayscale", style: "filter: grayscale(100%)", icon: "⚫" },
  { name: "Sepia", value: "sepia", style: "filter: sepia(100%)", icon: "🟤" },
  { name: "Vintage", value: "vintage", style: "filter: sepia(50%) contrast(120%) brightness(110%)", icon: "📸" },
  { name: "Cool", value: "cool", style: "filter: hue-rotate(180deg) saturate(120%)", icon: "🔵" }
];

const STICKERS = ["😊", "😎", "🥳", "😍", "🤩", "😘", "🥰", "😋", "🤗", "😇", "🦄", "🌈", "⭐", "💖", "🎉"];

const FRAME_TEMPLATES = [
  {
    id: "none",
    name: "No Frame",
    preview: "⬜",
    theme: "none"
  },
  {
    id: "heart",
    name: "Heart",
    preview: "💖",
    theme: "heart"
  },
  {
    id: "rainbow",
    name: "Rainbow",
    preview: "🌈", 
    theme: "rainbow"
  },
  {
    id: "star",
    name: "Star",
    preview: "⭐",
    theme: "star"
  },
  {
    id: "flower",
    name: "Flower",
    preview: "🌸",
    theme: "flower"
  },
  {
    id: "party",
    name: "Party",
    preview: "🎉",
    theme: "party"
  },
  {
    id: "cute",
    name: "Cute",
    preview: "🥰",
    theme: "cute"
  },
  {
    id: "cool",
    name: "Cool",
    preview: "😎",
    theme: "cool"
  },
  {
    id: "vintage",
    name: "Vintage",
    preview: "📸",
    theme: "vintage"
  },
  {
    id: "modern",
    name: "Modern",
    preview: "🔲",
    theme: "modern"
  }
];

interface Overlay {
  type: string;
  x: number;
  y: number;
  scale: number;
  id: string;
}

type Step = "layout" | "customize" | "capture";

export function CameraView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Camera states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  
  // Capture states
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Step management
  const [currentStep, setCurrentStep] = useState<Step>("layout");
  const [selectedLayout, setSelectedLayout] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState("");
  const [selectedFrame, setSelectedFrame] = useState("none");
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [draggedOverlay, setDraggedOverlay] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.photos.generateUploadUrl);
  const savePhoto = useMutation(api.photos.savePhoto);

  // Camera initialization with better error handling
  const initializeCamera = useCallback(async () => {
    if (cameraLoading || stream) return;
    
    setCameraLoading(true);
    setCameraError(null);
    setCameraReady(false);
    
    try {
      // Check browser support
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera not supported in this browser");
      }

      console.log("Requesting camera access...");
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: "user"
        },
        audio: false
      });
      
      console.log("Camera access granted, setting up video...");
      
      // Wait for video element to be available
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max
      
      while (!videoRef.current && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!videoRef.current) {
        throw new Error("Video element not available after waiting");
      }

      const video = videoRef.current;
      video.srcObject = mediaStream;
      
      // Wait for video to load with better error handling
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Video load timeout"));
        }, 10000);
        
        const onLoadedData = () => {
          clearTimeout(timeout);
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('error', onError);
          console.log("Video loaded successfully");
          resolve();
        };
        
        const onError = (e: Event) => {
          clearTimeout(timeout);
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('error', onError);
          console.error("Video load error:", e);
          reject(new Error("Failed to load video"));
        };
        
        video.addEventListener('loadeddata', onLoadedData);
        video.addEventListener('error', onError);
        
        // Try to play the video
        video.play().catch(console.error);
      });
      
      setStream(mediaStream);
      setCameraReady(true);
      console.log("Camera initialized successfully");
      
    } catch (error) {
      console.error("Camera initialization error:", error);
      
      let errorMessage = "Failed to access camera.";
      
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          errorMessage = "Camera access denied. Please allow camera permissions and refresh the page.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera found. Please connect a camera and try again.";
        } else if (error.name === "NotSupportedError") {
          errorMessage = "Camera not supported in this browser.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is being used by another application.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Camera took too long to load. Please try again.";
        } else if (error.message.includes("not available")) {
          errorMessage = "Camera setup failed. Please refresh the page and try again.";
        }
      }
      
      setCameraError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setCameraLoading(false);
    }
  }, [cameraLoading, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      console.log("Stopping camera...");
      stream.getTracks().forEach(track => {
        track.stop();
      });
      setStream(null);
      setCameraReady(false);
    }
  }, [stream]);

  // Initialize camera when step changes to customize or capture
  useEffect(() => {
    if (currentStep === "customize" || currentStep === "capture") {
      initializeCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      if (currentStep === "layout") {
        stopCamera();
      }
    };
  }, [currentStep, initializeCamera, stopCamera]);

  const addSticker = useCallback((sticker: string) => {
    const newOverlay: Overlay = {
      type: sticker,
      x: 320,
      y: 240,
      scale: 1,
      id: `${Date.now()}-${Math.random()}`
    };
    setOverlays(prev => [...prev, newOverlay]);
  }, []);

  const removeOverlay = useCallback((id: string) => {
    setOverlays(prev => prev.filter(overlay => overlay.id !== id));
  }, []);

  const handleOverlayMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverlay(id);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedOverlay || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(640, e.clientX - rect.left));
    const y = Math.max(0, Math.min(480, e.clientY - rect.top));

    setOverlays(prev => prev.map(overlay => 
      overlay.id === draggedOverlay 
        ? { ...overlay, x, y }
        : overlay
    ));
  }, [draggedOverlay]);

  const handleMouseUp = useCallback(() => {
    setDraggedOverlay(null);
  }, []);

  useEffect(() => {
    if (draggedOverlay) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedOverlay, handleMouseMove, handleMouseUp]);

  const capturePhotoFrame = async (): Promise<string> => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) {
      throw new Error("Camera not ready");
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const filterStyle = FILTERS.find(f => f.value === selectedFilter)?.style.replace("filter: ", "") || "none";
    ctx.filter = filterStyle;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    ctx.filter = "none";
    overlays.forEach(overlay => {
      ctx.save();
      ctx.font = `${40 * overlay.scale}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const scaleX = canvas.width / 640;
      const scaleY = canvas.height / 480;
      const x = overlay.x * scaleX;
      const y = overlay.y * scaleY;
      
      ctx.fillText(overlay.type, x, y);
      ctx.restore();
    });

    return canvas.toDataURL("image/png", 0.95);
  };

  const drawThemedFrame = (ctx: CanvasRenderingContext2D, width: number, height: number, theme: string) => {
    const borderWidth = 40;
    
    switch (theme) {
      case "heart":
        ctx.fillStyle = "#ff69b4";
        ctx.fillRect(0, 0, width, borderWidth);
        ctx.fillRect(0, height - borderWidth, width, borderWidth);
        ctx.fillRect(0, 0, borderWidth, height);
        ctx.fillRect(width - borderWidth, 0, borderWidth, height);
        
        ctx.font = "30px Arial";
        ctx.fillStyle = "#ff1493";
        ctx.textAlign = "center";
        for (let i = 0; i < width; i += 60) {
          ctx.fillText("💖", i, 25);
          ctx.fillText("💖", i, height - 15);
        }
        break;
        
      case "rainbow":
        const colors = ["#ff0000", "#ff8000", "#ffff00", "#00ff00", "#0080ff", "#8000ff"];
        const segmentHeight = borderWidth / colors.length;
        
        colors.forEach((color, i) => {
          ctx.fillStyle = color;
          ctx.fillRect(0, i * segmentHeight, width, segmentHeight);
          ctx.fillRect(0, height - borderWidth + i * segmentHeight, width, segmentHeight);
          ctx.fillRect(i * (borderWidth / colors.length), 0, borderWidth / colors.length, height);
          ctx.fillRect(width - borderWidth + i * (borderWidth / colors.length), 0, borderWidth / colors.length, height);
        });
        break;
        
      case "star":
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(0, 0, width, borderWidth);
        ctx.fillRect(0, height - borderWidth, width, borderWidth);
        ctx.fillRect(0, 0, borderWidth, height);
        ctx.fillRect(width - borderWidth, 0, borderWidth, height);
        
        ctx.font = "25px Arial";
        ctx.fillStyle = "#ffaa00";
        ctx.textAlign = "center";
        for (let i = 0; i < width; i += 50) {
          ctx.fillText("⭐", i, 25);
          ctx.fillText("⭐", i, height - 15);
        }
        break;
        
      case "flower":
        ctx.fillStyle = "#ffb6c1";
        ctx.fillRect(0, 0, width, borderWidth);
        ctx.fillRect(0, height - borderWidth, width, borderWidth);
        ctx.fillRect(0, 0, borderWidth, height);
        ctx.fillRect(width - borderWidth, 0, borderWidth, height);
        
        ctx.font = "25px Arial";
        ctx.fillStyle = "#ff69b4";
        ctx.textAlign = "center";
        for (let i = 0; i < width; i += 50) {
          ctx.fillText("🌸", i, 25);
          ctx.fillText("🌸", i, height - 15);
        }
        break;
        
      case "party":
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#ff6b6b");
        gradient.addColorStop(0.5, "#4ecdc4");
        gradient.addColorStop(1, "#45b7d1");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, borderWidth);
        ctx.fillRect(0, height - borderWidth, width, borderWidth);
        ctx.fillRect(0, 0, borderWidth, height);
        ctx.fillRect(width - borderWidth, 0, borderWidth, height);
        
        ctx.font = "25px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        for (let i = 0; i < width; i += 50) {
          ctx.fillText("🎉", i, 25);
          ctx.fillText("🎊", i, height - 15);
        }
        break;
        
      case "cute":
        ctx.fillStyle = "#ffcccb";
        ctx.fillRect(0, 0, width, borderWidth);
        ctx.fillRect(0, height - borderWidth, width, borderWidth);
        ctx.fillRect(0, 0, borderWidth, height);
        ctx.fillRect(width - borderWidth, 0, borderWidth, height);
        
        ctx.font = "25px Arial";
        ctx.fillStyle = "#ff69b4";
        ctx.textAlign = "center";
        for (let i = 0; i < width; i += 50) {
          ctx.fillText("🥰", i, 25);
          ctx.fillText("💕", i, height - 15);
        }
        break;
        
      case "cool":
        ctx.fillStyle = "#87ceeb";
        ctx.fillRect(0, 0, width, borderWidth);
        ctx.fillRect(0, height - borderWidth, width, borderWidth);
        ctx.fillRect(0, 0, borderWidth, height);
        ctx.fillRect(width - borderWidth, 0, borderWidth, height);
        
        ctx.font = "25px Arial";
        ctx.fillStyle = "#4169e1";
        ctx.textAlign = "center";
        for (let i = 0; i < width; i += 50) {
          ctx.fillText("😎", i, 25);
          ctx.fillText("🔥", i, height - 15);
        }
        break;
        
      case "vintage":
        ctx.fillStyle = "#deb887";
        ctx.fillRect(0, 0, width, borderWidth);
        ctx.fillRect(0, height - borderWidth, width, borderWidth);
        ctx.fillRect(0, 0, borderWidth, height);
        ctx.fillRect(width - borderWidth, 0, borderWidth, height);
        
        ctx.font = "20px serif";
        ctx.fillStyle = "#8b4513";
        ctx.textAlign = "center";
        ctx.fillText("✨ VINTAGE ✨", width / 2, 25);
        break;
        
      case "modern":
        ctx.strokeStyle = "#333333";
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, width - 8, height - 8);
        
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, width - 16, height - 16);
        break;
    }
  };

  const createFramedPhoto = async (photos: string[], layout: any): Promise<Blob> => {
    const finalCanvas = document.createElement("canvas");
    const ctx = finalCanvas.getContext("2d")!;
    
    const { rows, cols } = layout;
    const photoWidth = 300;
    const photoHeight = 225;
    const spacing = 10;
    const borderWidth = selectedFrame !== "none" ? 40 : 20;
    
    finalCanvas.width = cols * photoWidth + (cols - 1) * spacing + 2 * borderWidth;
    finalCanvas.height = rows * photoHeight + (rows - 1) * spacing + 2 * borderWidth;
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
    
    for (let i = 0; i < Math.min(photos.length, rows * cols); i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = borderWidth + col * (photoWidth + spacing);
      const y = borderWidth + row * (photoHeight + spacing);
      
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = photos[i];
      });
      
      ctx.drawImage(img, x, y, photoWidth, photoHeight);
    }
    
    if (selectedFrame !== "none") {
      const frameTemplate = FRAME_TEMPLATES.find(f => f.id === selectedFrame);
      if (frameTemplate && frameTemplate.theme !== "none") {
        drawThemedFrame(ctx, finalCanvas.width, finalCanvas.height, frameTemplate.theme);
      }
    }
    
    return new Promise((resolve) => {
      finalCanvas.toBlob((blob) => resolve(blob!), "image/png", 0.95);
    });
  };

  const capturePhoto = async () => {
    if (!cameraReady) {
      toast.error("Camera not ready");
      return;
    }

    setIsCapturing(true);
    
    try {
      const layout = LAYOUTS.find(l => l.id === selectedLayout)!;
      const requiredPhotos = layout.layout.rows * layout.layout.cols;
      
      const newPhotos: string[] = [];
      
      for (let i = 0; i < requiredPhotos; i++) {
        // Countdown for each photo
        for (let j = 3; j > 0; j--) {
          setCountdown(j);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        setCountdown(0);
        
        const photoData = await capturePhotoFrame();
        newPhotos.push(photoData);
        setCapturedPhotos(prev => [...prev, photoData]);
        
        // Flash effect
        const flash = document.createElement("div");
        flash.className = "fixed inset-0 bg-white z-50 pointer-events-none";
        flash.style.opacity = "0";
        flash.style.transition = "opacity 0.15s ease-out";
        document.body.appendChild(flash);
        
        requestAnimationFrame(() => {
          flash.style.opacity = "0.8";
          setTimeout(() => {
            flash.style.opacity = "0";
            setTimeout(() => {
              if (document.body.contains(flash)) {
                document.body.removeChild(flash);
              }
            }, 150);
          }, 100);
        });
        
        if (i < requiredPhotos - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }
      
      // Create final framed photo
      const finalBlob = await createFramedPhoto(newPhotos, layout.layout);
      
      // Upload to Convex
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": finalBlob.type },
        body: finalBlob,
      });

      if (!result.ok) {
        throw new Error(`Upload failed: ${result.statusText}`);
      }

      const { storageId } = await result.json();
      const filename = `photo-${Date.now()}.png`;

      await savePhoto({
        storageId,
        filename,
        filter: selectedFilter || undefined,
        overlays: overlays.map(({ id, ...overlay }) => overlay),
        frameId: selectedFrame !== "none" ? selectedFrame : undefined
      });

      toast.success("📸 Photo captured successfully!");
      
      // Reset for new session
      setCapturedPhotos([]);
      setCurrentStep("layout");
      setSelectedLayout("");
      setSelectedFilter("");
      setSelectedFrame("none");
      setOverlays([]);
      
    } catch (error) {
      console.error("Capture error:", error);
      toast.error("Failed to capture photo");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleLayoutSelect = (layoutId: string) => {
    setSelectedLayout(layoutId);
    setCurrentStep("customize");
  };

  const handleStartCapture = () => {
    setCurrentStep("capture");
    setCapturedPhotos([]);
  };

  // Error state
  if (cameraError) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-12 shadow-xl text-center max-w-md mx-auto">
          <div className="text-6xl mb-4">📷</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Camera Error</h2>
          <p className="text-gray-600 mb-6 text-sm leading-relaxed">{cameraError}</p>
          <button
            onClick={initializeCamera}
            disabled={cameraLoading}
            className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {cameraLoading ? "Loading..." : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Layout Selection
  if (currentStep === "layout") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Choose Your Layout</h2>
            <p className="text-gray-600">Select how many photos you want to take</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {LAYOUTS.map(layout => (
              <button
                key={layout.id}
                onClick={() => handleLayoutSelect(layout.id)}
                className="group bg-gradient-to-br from-pink-50 to-purple-50 border-2 border-gray-200 rounded-2xl p-6 hover:border-pink-300 hover:shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                <div className="text-center">
                  <div className="text-4xl mb-3">{layout.icon}</div>
                  <div className="text-2xl font-mono mb-2 text-gray-700">{layout.preview}</div>
                  <h3 className="font-bold text-gray-800 mb-1">{layout.name}</h3>
                  <p className="text-sm text-gray-600">{layout.description}</p>
                  <div className="mt-3 text-xs text-purple-600 font-medium">
                    {layout.layout.rows * layout.layout.cols} photos
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Customize
  if (currentStep === "customize") {
    const selectedLayoutData = LAYOUTS.find(l => l.id === selectedLayout)!;
    
    return (
      <div className="space-y-6">
        {/* Camera Preview */}
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <div className="max-w-lg mx-auto">
            <div 
              ref={containerRef}
              className="relative overflow-hidden rounded-2xl bg-gray-900 shadow-lg"
              style={{ aspectRatio: "4/3" }}
            >
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{
                  filter: FILTERS.find(f => f.value === selectedFilter)?.style.replace("filter: ", "") || "none",
                  transform: "scaleX(-1)"
                }}
              />
              
              {/* Hidden Canvas */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
              />
              
              {/* Overlays */}
              {overlays.map(overlay => (
                <div
                  key={overlay.id}
                  className="absolute cursor-move select-none hover:scale-110 transition-transform z-10"
                  style={{
                    left: `${(overlay.x / 640) * 100}%`,
                    top: `${(overlay.y / 480) * 100}%`,
                    transform: `translate(-50%, -50%) scale(${overlay.scale}) scaleX(-1)`,
                    fontSize: "2rem",
                    userSelect: "none"
                  }}
                  onMouseDown={(e) => handleOverlayMouseDown(overlay.id, e)}
                  onDoubleClick={() => removeOverlay(overlay.id)}
                >
                  {overlay.type}
                </div>
              ))}

              {/* Loading State */}
              {(cameraLoading || !cameraReady) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                  <div className="text-white text-lg text-center">
                    <div className="animate-spin text-4xl mb-4">📷</div>
                    <div>{cameraLoading ? "Starting camera..." : "Loading camera..."}</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Layout Info */}
            <div className="mt-4 text-center">
              <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                <span>{selectedLayoutData.icon}</span>
                <span>{selectedLayoutData.name}</span>
                <span>•</span>
                <span>{selectedLayoutData.layout.rows * selectedLayoutData.layout.cols} photos</span>
              </div>
            </div>

            {/* Main Action Button */}
            <div className="mt-6 text-center">
              <button
                onClick={handleStartCapture}
                disabled={!cameraReady || cameraLoading}
                className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-12 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                📸 Start Shooting!
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Choose Filter</h3>
          <div className="flex justify-center">
            <div className="flex space-x-3 overflow-x-auto pb-2 max-w-full">
              {FILTERS.map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedFilter(filter.value)}
                  className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all ${
                    selectedFilter === filter.value
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <div className="text-lg mb-1">{filter.icon}</div>
                  <div className="text-sm">{filter.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Customization Options */}
        <div className="bg-white rounded-3xl p-6 shadow-xl space-y-6">
          {/* Frame Templates */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Frame Style</h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
              {FRAME_TEMPLATES.map(frame => (
                <button
                  key={frame.id}
                  onClick={() => setSelectedFrame(frame.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selectedFrame === frame.id
                      ? "border-purple-500 bg-purple-50 shadow-lg scale-105"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <div className="text-xl mb-1">{frame.preview}</div>
                  <div className="text-xs font-medium text-gray-700 truncate">{frame.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Stickers */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add Stickers</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {STICKERS.map(sticker => (
                <button
                  key={sticker}
                  onClick={() => addSticker(sticker)}
                  className="text-2xl p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors hover:scale-110 transform"
                >
                  {sticker}
                </button>
              ))}
            </div>
            {overlays.length > 0 && (
              <p className="text-sm text-gray-500 mt-3 text-center">
                💡 Drag stickers to move them, double-click to remove
              </p>
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={() => setCurrentStep("layout")}
            className="bg-gray-200 text-gray-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-300 transition-all"
          >
            ← Back to Layout
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Capture
  const selectedLayoutData = LAYOUTS.find(l => l.id === selectedLayout)!;
  const totalPhotos = selectedLayoutData.layout.rows * selectedLayoutData.layout.cols;
  const currentPhotoIndex = capturedPhotos.length;

  return (
    <div className="space-y-6">
      {/* Camera Preview */}
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <div className="max-w-lg mx-auto">
          <div 
            ref={containerRef}
            className="relative overflow-hidden rounded-2xl bg-gray-900 shadow-lg"
            style={{ aspectRatio: "4/3" }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{
                filter: FILTERS.find(f => f.value === selectedFilter)?.style.replace("filter: ", "") || "none",
                transform: "scaleX(-1)"
              }}
            />
            
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none opacity-0"
            />
            
            {overlays.map(overlay => (
              <div
                key={overlay.id}
                className="absolute cursor-move select-none hover:scale-110 transition-transform z-10"
                style={{
                  left: `${(overlay.x / 640) * 100}%`,
                  top: `${(overlay.y / 480) * 100}%`,
                  transform: `translate(-50%, -50%) scale(${overlay.scale}) scaleX(-1)`,
                  fontSize: "2rem",
                  userSelect: "none",
                  pointerEvents: isCapturing ? "none" : "auto"
                }}
                onMouseDown={(e) => handleOverlayMouseDown(overlay.id, e)}
                onDoubleClick={() => removeOverlay(overlay.id)}
              >
                {overlay.type}
              </div>
            ))}

            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                <div className="text-8xl font-bold text-white animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {(cameraLoading || !cameraReady) && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-white text-lg">Loading camera...</div>
              </div>
            )}
          </div>
          
          {/* Progress Info */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
              <span>{selectedLayoutData.icon}</span>
              <span>Photo {currentPhotoIndex + 1} of {totalPhotos}</span>
            </div>
          </div>

          {/* Main Action Button */}
          <div className="mt-6 text-center">
            <button
              onClick={capturePhoto}
              disabled={isCapturing || !cameraReady}
              className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-12 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isCapturing ? "📸 Capturing..." : 
               currentPhotoIndex >= totalPhotos ? "✨ Finish & Save" :
               `📸 Snap Photo ${currentPhotoIndex + 1}!`}
            </button>
          </div>
        </div>
      </div>

      {/* Captured Photos Preview */}
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Your Photos</h3>
        <div className={`grid gap-3 mx-auto max-w-4xl ${
          selectedLayoutData.layout.cols === 1 ? 'grid-cols-1' :
          selectedLayoutData.layout.cols === 2 ? 'grid-cols-2' :
          'grid-cols-4'
        }`}>
          {Array.from({ length: totalPhotos }).map((_, index) => (
            <div
              key={index}
              className={`aspect-square rounded-xl border-2 ${
                index < capturedPhotos.length
                  ? "border-green-300 bg-green-50"
                  : index === currentPhotoIndex
                  ? "border-purple-300 bg-purple-50 animate-pulse"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              {index < capturedPhotos.length ? (
                <img
                  src={capturedPhotos[index]}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {index === currentPhotoIndex ? "📸" : "⭕"}
                    </div>
                    <div className="text-xs">
                      {index === currentPhotoIndex ? "Next" : `Photo ${index + 1}`}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            setCurrentStep("customize");
            setCapturedPhotos([]);
          }}
          disabled={isCapturing}
          className="bg-gray-200 text-gray-700 px-8 py-3 rounded-full font-semibold hover:bg-gray-300 transition-all disabled:opacity-50"
        >
          ← Back to Customize
        </button>
      </div>
    </div>
  );
}
