/**
 * Movement input shared between the on-screen move pad (DOM) and the
 * WalkController (render loop). A plain mutable object: written on pointer
 * events, read every frame, never triggers React renders.
 */
export const walkInput = {
  /** −1 back … +1 forward. */
  forward: 0,
  /** −1 left … +1 right. */
  strafe: 0,
};
