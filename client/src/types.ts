export type PlayerState = {
  id: string;
  name: string;
  x: number;
  y: number;
};

export type ChatMessage = {
  id: string;
  senderName: string;
  message: string;
  timestamp: number;
};

export type NearbyPlayer = {
  id: string;
  name: string;
};
