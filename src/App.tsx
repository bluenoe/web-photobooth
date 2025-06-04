import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { PhotoboothApp } from "./PhotoboothApp";

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-indigo-100">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-pink-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            📸 Fun Photobooth
          </h1>
          <Authenticated>
            <SignOutButton />
          </Authenticated>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Authenticated>
          <PhotoboothApp />
        </Authenticated>
        
        <Unauthenticated>
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full">
              <div className="text-6xl mb-4">📸</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Welcome to Fun Photobooth!
              </h2>
              <p className="text-gray-600 mb-8">
                Sign in to start taking amazing photos with filters, stickers, and more!
              </p>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>
      </main>
      
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'white',
            color: 'black',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
          },
        }}
      />
    </div>
  );
}
