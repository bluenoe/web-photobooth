import React, { useState } from 'react';
import './FrameSelector.css'; // Import Tailwind CSS styles

const FrameSelector: React.FC = () => {
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);

  const frames = [
    'frame1.png',
    'frame2.png',
    'frame3.png', // Add more frame filenames here
  ];

  const handleFrameClick = (frame: string) => {
    setSelectedFrame(frame);
  };

  return (
    <div className="frame-selector-container">
      <h2 className="text-lg font-bold mb-4">Choose a Frame</h2>
      <div className="grid grid-cols-3 gap-4">
        {frames.map((frame) => (
          <div
            key={frame}
            className={`frame-thumbnail border-2 rounded-lg overflow-hidden cursor-pointer transition-transform transform hover:scale-105 ${
              selectedFrame === frame ? 'border-blue-500' : 'border-gray-300'
            }`}
            onClick={() => handleFrameClick(frame)}
          >
            <img
              src={`/frames/${frame}`}
              alt={frame}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
      {selectedFrame && (
        <div className="preview mt-6">
          <h3 className="text-md font-semibold mb-2">Preview</h3>
          <img
            src={`/frames/${selectedFrame}`}
            alt="Selected Frame"
            className="w-full h-auto border border-gray-400 rounded-lg"
          />
        </div>
      )}
    </div>
  );
};

export default FrameSelector;