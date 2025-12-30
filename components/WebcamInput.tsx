import React, { useEffect, useRef, useState } from 'react';
import { Hands, Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { detectGesture } from '../utils/gestureUtils';
import { HandTrackingData, GestureType } from '../types';

interface WebcamInputProps {
  onHandUpdate: (data: HandTrackingData | null) => void;
  onCameraReady: () => void;
}

const WebcamInput: React.FC<WebcamInputProps> = ({ onHandUpdate, onCameraReady }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const videoElement = videoRef.current;
    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext('2d');

    const onResults = (results: Results) => {
      if (!canvasCtx) return;

      // Draw the mirrored webcam feed to the preview canvas
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      // Mirror the context
      canvasCtx.translate(canvasElement.width, 0);
      canvasCtx.scale(-1, 1);
      canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height
      );
      
      // We don't draw landmarks here to keep the aesthetic clean, 
      // but we could use drawConnectors/drawLandmarks from @mediapipe/drawing_utils if needed.
      
      canvasCtx.restore();

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const gesture = detectGesture(landmarks);
        
        // Palm center approximation (Middle MCP + Wrist / 2)
        // Remember input is mirrored, so x is 1 - x for screen mapping if we want intuitive controls
        // But since we are mirroring the draw, we also need to consider the logic.
        // MediaPipe coords: 0,0 is top-left. 
        // If user moves hand right (screen right), in webcam that is usually left side of image.
        // We want: User moves hand Right -> Firework on Right.
        
        const palmX = landmarks[9].x; // Middle finger MCP
        const palmY = landmarks[9].y;

        onHandUpdate({
          x: 1 - palmX, // Mirroring logic for interactive feel
          y: palmY,
          gesture,
          timestamp: Date.now()
        });
      } else {
        onHandUpdate(null);
      }
      
      if (isLoading) {
        setIsLoading(false);
        onCameraReady();
      }
    };

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
      onFrame: async () => {
        await hands.send({ image: videoElement });
      },
      width: 640,
      height: 480
    });

    camera.start();

    return () => {
      camera.stop();
      hands.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-white/20 shadow-2xl bg-black">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-white z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-t-blue-500 border-white/20 rounded-full animate-spin"></div>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Initializing Vision</span>
          </div>
        </div>
      )}
      {/* Hidden source video */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
      />
      {/* Mirrored Preview Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover block"
        width={320}
        height={240}
      />
      
      {/* Overlay UI */}
      <div className="absolute bottom-2 left-2 text-[10px] text-white/50 font-mono pointer-events-none">
        <p>PREVIEW</p>
      </div>
    </div>
  );
};

export default WebcamInput;