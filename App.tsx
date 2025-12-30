import React, { useRef, useState } from 'react';
import WebcamInput from './components/WebcamInput';
import FireworkDisplay from './components/FireworkDisplay';
import { HandTrackingData } from './types';

const App: React.FC = () => {
  // We use a ref for high-frequency updates to avoid re-rendering the whole React tree at 60fps
  const handDataRef = useRef<HandTrackingData | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleHandUpdate = (data: HandTrackingData | null) => {
    handDataRef.current = data;
  };

  const handleCameraReady = () => {
    setIsReady(true);
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans select-none">
      
      {/* Background Canvas Layer */}
      <FireworkDisplay handData={handDataRef} />

      {/* Foreground UI Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header */}
        <header className="flex justify-between items-start">
          <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-lg">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
              HandWorks
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Interactive Gesture Fireworks</p>
          </div>

          {/* Instructions */}
          <div className={`transition-opacity duration-700 ${isReady ? 'opacity-100' : 'opacity-0'} bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white max-w-xs`}>
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Controls</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></span>
                <span><strong className="text-green-300">Open Hand</strong> to Explode</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                <span><strong className="text-red-300">Closed Fist</strong> to Clear</span>
              </li>
            </ul>
          </div>
        </header>

        {/* Footer / Webcam Area */}
        <div className="flex justify-between items-end">
          <div className="pointer-events-auto w-48 h-36 md:w-64 md:h-48 transition-transform hover:scale-105 duration-300">
             <WebcamInput 
                onHandUpdate={handleHandUpdate} 
                onCameraReady={handleCameraReady}
             />
          </div>
          
          <div className="text-right text-zinc-600 text-xs pb-2 pr-2">
            <p>Powered by MediaPipe & React</p>
            <p className="opacity-50">60 FPS Particle System</p>
          </div>
        </div>

      </div>
      
    </div>
  );
};

export default App;