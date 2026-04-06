export type PlayerState = {
  id: string;
  name: string;
  x: number;
  y: number;
  variant: number;
};

export type ChatMessage = {
  senderName: string;
  message: string;
  timestamp: number;
};

export type NearbyPlayer = {
  id: string;
  name: string;
};
