import { NormalizedLandmark } from '@mediapipe/hands';
import { GestureType } from '../types';

/**
 * Calculates Euclidean distance between two landmarks
 */
function getDistance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

/**
 * Detects if the hand is Open, Closed (Fist), or Neutral based on landmark positions.
 * Uses a heuristic comparing finger tip distances relative to hand size.
 */
export function detectGesture(landmarks: NormalizedLandmark[]): GestureType {
  if (!landmarks || landmarks.length < 21) return GestureType.UNKNOWN;

  // Key landmarks
  const wrist = landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const middleMCP = landmarks[9]; // Middle finger knuckle

  // Calculate approximate hand size (Wrist to Middle Knuckle)
  // This helps normalize the thresholds for different hand distances from camera
  const handSize = getDistance(wrist, middleMCP);

  // Define thresholds relative to hand size
  // If tip is closer to wrist than this factor * handSize, it's curled.
  const curlThreshold = handSize * 1.1; 
  // If tip is further from wrist than this factor, it's extended.
  const extendThreshold = handSize * 1.3;

  const tips = [indexTip, middleTip, ringTip, pinkyTip];
  
  let curledCount = 0;
  let extendedCount = 0;

  // Check 4 fingers (excluding thumb for now as it moves laterally)
  tips.forEach(tip => {
    const distToWrist = getDistance(tip, wrist);
    if (distToWrist < curlThreshold) {
      curledCount++;
    } else if (distToWrist > extendThreshold) {
      extendedCount++;
    }
  });

  // Thumb check: compare tip distance to pinky MCP vs IP distance?
  // Simpler thumb check: is it far from the index MCP?
  const indexMCP = landmarks[5];
  const thumbDist = getDistance(thumbTip, indexMCP);
  const isThumbCurled = thumbDist < handSize * 0.5;

  if (isThumbCurled) curledCount++;
  else extendedCount++;

  // Determine gesture
  // Strict check: 5 fingers curled = Closed
  if (curledCount >= 4) return GestureType.CLOSED;
  
  // Strict check: 5 fingers extended = Open
  if (extendedCount >= 4) return GestureType.OPEN;

  return GestureType.NEUTRAL;
}