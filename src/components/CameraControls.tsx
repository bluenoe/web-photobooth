import React, { useState } from 'react';

const CameraControls: React.FC = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlipCamera = () => {
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className="camera-controls">
      <button
        onClick={handleFlipCamera}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition"
      >
        Flip Camera
      </button>
      <video
        id="webcam"
        className={`mt-4 ${isFlipped ? 'transform scale-x-[-1]' : ''}`}
        autoPlay
        playsInline
      ></video>
    </div>
  );
};

export default CameraControls;