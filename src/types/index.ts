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
  sessionId: string;
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
  name: string;
  playerName: string;
  startTime: number;
  endTime?: number;
  isActive: boolean;
}

export interface ExportTemplate {
  id: string;
  name: string;
  filterType: 'all' | 'best' | 'scare' | 'understand' | 'miss' | 'funny';
  groupBy: 'room' | 'player' | 'tag' | 'time';
  createdAt: number;
}
