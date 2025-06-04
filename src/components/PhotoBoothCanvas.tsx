import React, { useRef } from 'react';

interface PhotoBoothCanvasProps {
  photos: string[]; // Array of photo URLs
  layout: string; // Selected layout (e.g., '2x2', '3x2', etc.)
}

const PhotoBoothCanvas: React.FC<PhotoBoothCanvasProps> = ({ photos, layout }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawLayout = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Define layout configurations
      const layoutsConfig: Record<string, { rows: number; cols: number }> = {
        '2x2': { rows: 2, cols: 2 },
        '3x2': { rows: 3, cols: 2 },
        '4x1': { rows: 1, cols: 4 },
        '4x2': { rows: 2, cols: 4 },
      };

    const config = layoutsConfig[layout];
    if (!config) return;

    const { rows, cols } = config;
    const padding = 20;
    const photoWidth = (canvas.width - padding * (cols + 1)) / cols;
    const photoHeight = (canvas.height - padding * (rows + 1)) / rows;

    photos.forEach((photo, index) => {
      const img = new Image();
      img.src = photo;
      img.onload = () => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = padding + col * (photoWidth + padding);
        const y = padding + row * (photoHeight + padding);
        ctx.drawImage(img, x, y, photoWidth, photoHeight);
      };
    });
  };

  React.useEffect(() => {
    drawLayout();
  }, [photos, layout]);

  return <canvas ref={canvasRef} width={800} height={600} className="border border-gray-300 shadow-lg" />;
};

export default PhotoBoothCanvas;
