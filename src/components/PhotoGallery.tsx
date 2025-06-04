import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useState } from "react";

const FRAME_NAMES: Record<string, string> = {
  "none": "No Frame",
  "grid-2x2": "2x2 Grid",
  "strip-4x1": "Photo Strip",
  "strip-1x4": "Wide Strip",
  "heart-frame": "Heart Frame",
  "blackpink-frame": "BLACKPINK",
  "bts-frame": "BTS",
  "rainbow-frame": "Rainbow"
};

export function PhotoGallery() {
  const photos = useQuery(api.photos.getUserPhotos) || [];
  const deletePhoto = useMutation(api.photos.deletePhoto);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch image");
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("📥 Photo downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download photo");
    }
  };

  const handleDelete = async (photoId: Id<"photos">) => {
    if (!confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    setDeletingIds(prev => new Set(prev).add(photoId));
    
    try {
      await deletePhoto({ photoId });
      toast.success("🗑️ Photo deleted!");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete photo");
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });
    }
  };

  const handleShare = async (url: string, filename: string) => {
    try {
      if (navigator.share && navigator.canShare) {
        const response = await fetch(url);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Check out my photobooth pic!",
            files: [file]
          });
          return;
        }
      }
      
      await navigator.clipboard.writeText(url);
      toast.success("📋 Photo link copied to clipboard!");
    } catch (error) {
      console.error("Share error:", error);
      try {
        await navigator.clipboard.writeText(url);
        toast.success("📋 Photo link copied to clipboard!");
      } catch (clipboardError) {
        toast.error("Failed to share photo");
      }
    }
  };

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 shadow-xl text-center">
        <div className="text-6xl mb-4">📷</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No photos yet!</h2>
        <p className="text-gray-600">
          Head to the camera tab to start taking some amazing photos with frames!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          🖼️ Your Photo Gallery ({photos.length} photos)
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {photos.map((photo) => {
            const isDeleting = deletingIds.has(photo._id);
            
            return (
              <div
                key={photo._id}
                className={`group relative bg-gray-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                  isDeleting ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {/* Photo */}
                <div className="aspect-square overflow-hidden">
                  {photo.url ? (
                    <img
                      src={photo.url}
                      alt={photo.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        target.nextElementSibling?.classList.remove("hidden");
                      }}
                    />
                  ) : null}
                  
                  <div className="hidden w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <div className="text-sm">Image not available</div>
                    </div>
                  </div>
                </div>
                
                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => photo.url && handleDownload(photo.url, photo.filename)}
                      disabled={!photo.url || isDeleting}
                      className="bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                      title="Download"
                    >
                      📥
                    </button>
                    <button
                      onClick={() => photo.url && handleShare(photo.url, photo.filename)}
                      disabled={!photo.url || isDeleting}
                      className="bg-white text-gray-800 p-3 rounded-full shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                      title="Share"
                    >
                      📤
                    </button>
                    <button
                      onClick={() => handleDelete(photo._id)}
                      disabled={isDeleting}
                      className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      {isDeleting ? "⏳" : "🗑️"}
                    </button>
                  </div>
                </div>
                
                {/* Photo info */}
                <div className="p-4">
                  <p className="text-sm text-gray-600 truncate" title={photo.filename}>
                    {photo.filename}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(photo._creationTime).toLocaleDateString()}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {photo.filter && (
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {photo.filter}
                      </span>
                    )}
                    {photo.frameId && photo.frameId !== "none" && (
                      <span className="inline-block px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                        {FRAME_NAMES[photo.frameId] || photo.frameId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
