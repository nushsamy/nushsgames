export function roomName(gamekey: string): string {
  return `gamekey:${gamekey}`;
}

export function hostRoomName(gamekey: string): string {
  return `gamekey:${gamekey}:host`;
}
