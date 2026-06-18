export interface Room {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  type: TagType;
  color: string;
  icon?: string;
}

export type TagType = 'stay' | 'miss' | 'scare' | 'loop' | 'understand' | 'best' | 'other';

export interface RecordItem {
  id: string;
  roomId: string;
  roomName: string;
  tags: string[];
  note: string;
  timestamp: number;
  playerId?: string;
  playerName?: string;
}

export interface RoomStats {
  roomId: string;
  roomName: string;
  totalRecords: number;
  tagCounts: Record<string, number>;
  avgDuration?: number;
}

export interface PlaySession {
  id: string;
  playerName: string;
  startTime: number;
  endTime?: number;
  records: RecordItem[];
}
