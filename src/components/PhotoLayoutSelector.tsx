import React, { useState } from 'react';

const layouts = [
  { id: '2x2', label: '2x2 Layout' },
  { id: '3x2', label: '3x2 Layout' },
  { id: '4x1', label: '4x1 Layout' },
  { id: '4x2', label: '4x2 Layout' },
];

interface PhotoLayoutSelectorProps {
  onLayoutSelect: (layout: string) => void;
}

const PhotoLayoutSelector: React.FC<PhotoLayoutSelectorProps> = ({ onLayoutSelect }) => {
  const [selectedLayout, setSelectedLayout] = useState<string>('2x2');

  const handleLayoutChange = (layout: string) => {
    setSelectedLayout(layout);
    onLayoutSelect(layout);
  };

  return (
    <div className="photo-layout-selector">
      <h2 className="text-lg font-bold mb-4">Choose a Layout</h2>
      <div className="flex gap-4">
        {layouts.map((layout) => (
          <button
            key={layout.id}
            onClick={() => handleLayoutChange(layout.id)}
            className={`px-4 py-2 rounded-lg shadow-md transition-all ${
              selectedLayout === layout.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {layout.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PhotoLayoutSelector;
