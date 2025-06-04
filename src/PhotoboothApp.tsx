import { useState } from "react";
import { CameraView } from "./components/CameraView";
import { PhotoGallery } from "./components/PhotoGallery";

export function PhotoboothApp() {
  const [activeTab, setActiveTab] = useState<"camera" | "gallery">("camera");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="bg-white rounded-2xl p-2 shadow-lg">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("camera")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === "camera"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              📷 Camera
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                activeTab === "gallery"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              🖼️ Gallery
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[60vh]">
        {activeTab === "camera" && <CameraView />}
        {activeTab === "gallery" && <PhotoGallery />}
      </div>
    </div>
  );
}
