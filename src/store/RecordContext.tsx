import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { RecordItem, Room } from '@/types';
import { mockRecords } from '@/data/mockRecords';
import { mockRooms } from '@/data/mockRooms';

interface RecordContextType {
  records: RecordItem[];
  rooms: Room[];
  currentRoomId: string | null;
  selectedTags: string[];
  playerName: string;
  addRecord: (record: Omit<RecordItem, 'id' | 'timestamp'>) => void;
  setCurrentRoom: (roomId: string) => void;
  toggleTag: (tagId: string) => void;
  clearSelectedTags: () => void;
  setPlayerName: (name: string) => void;
  getRecordsByRoom: (roomId: string) => RecordItem[];
  getRecordsByTag: (tagId: string) => RecordItem[];
  deleteRecord: (recordId: string) => void;
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

export const RecordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<RecordItem[]>(mockRecords);
  const [rooms] = useState<Room[]>(mockRooms);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState<string>('试玩员1号');

  const addRecord = useCallback((recordData: Omit<RecordItem, 'id' | 'timestamp'>) => {
    const newRecord: RecordItem = {
      ...recordData,
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    setRecords(prev => [...prev, newRecord]);
    console.log('[RecordContext] 添加记录:', newRecord);
  }, []);

  const setCurrentRoom = useCallback((roomId: string) => {
    setCurrentRoomId(roomId);
  }, []);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  }, []);

  const clearSelectedTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  const getRecordsByRoom = useCallback((roomId: string) => {
    return records.filter(r => r.roomId === roomId).sort((a, b) => a.timestamp - b.timestamp);
  }, [records]);

  const getRecordsByTag = useCallback((tagId: string) => {
    return records.filter(r => r.tags.includes(tagId)).sort((a, b) => b.timestamp - a.timestamp);
  }, [records]);

  const deleteRecord = useCallback((recordId: string) => {
    setRecords(prev => prev.filter(r => r.id !== recordId));
  }, []);

  return (
    <RecordContext.Provider value={{
      records,
      rooms,
      currentRoomId,
      selectedTags,
      playerName,
      addRecord,
      setCurrentRoom,
      toggleTag,
      clearSelectedTags,
      setPlayerName,
      getRecordsByRoom,
      getRecordsByTag,
      deleteRecord
    }}>
      {children}
    </RecordContext.Provider>
  );
};

export const useRecord = () => {
  const context = useContext(RecordContext);
  if (!context) {
    throw new Error('useRecord must be used within a RecordProvider');
  }
  return context;
};
