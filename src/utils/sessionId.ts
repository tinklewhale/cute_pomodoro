// Stable page-session-scoped ID shared between RoomView and timer broadcasting.
// Regenerates on page reload (intentional – keeps room membership fresh).
export const SESSION_USER_ID = `user_${Math.random().toString(36).slice(2, 10)}`;
