import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { RecordItem, Room } from '@/types';
import { mockRecords } from '@/data/mockRecords';
import { mockRooms } from '@/data/mockRooms';

const STORAGE_KEY_RECORDS = 'haunted_house_records';
const STORAGE_KEY_PLAYER = 'haunted_house_player';

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
  clearAllRecords: () => void;
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

const loadRecordsFromStorage = (): RecordItem[] => {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY_RECORDS);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      console.log('[RecordContext] 从本地存储加载记录:', stored.length, '条');
      return stored;
    }
  } catch (error) {
    console.error('[RecordContext] 读取本地存储失败:', error);
  }
  console.log('[RecordContext] 使用默认 mock 数据');
  return mockRecords;
};

const loadPlayerFromStorage = (): string => {
  try {
    const stored = Taro.getStorageSync(STORAGE_KEY_PLAYER);
    if (stored && typeof stored === 'string') {
      return stored;
    }
  } catch (error) {
    console.error('[RecordContext] 读取玩家名失败:', error);
  }
  return '试玩员1号';
};

export const RecordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [records, setRecords] = useState<RecordItem[]>(() => loadRecordsFromStorage());
  const [rooms] = useState<Room[]>(mockRooms);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [playerName, setPlayerNameState] = useState<string>(() => loadPlayerFromStorage());

  useEffect(() => {
    try {
      Taro.setStorageSync(STORAGE_KEY_RECORDS, records);
      console.log('[RecordContext] 已持久化记录到本地存储:', records.length, '条');
    } catch (error) {
      console.error('[RecordContext] 写入本地存储失败:', error);
    }
  }, [records]);

  useEffect(() => {
    try {
      Taro.setStorageSync(STORAGE_KEY_PLAYER, playerName);
    } catch (error) {
      console.error('[RecordContext] 写入玩家名失败:', error);
    }
  }, [playerName]);

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

  const setPlayerName = useCallback((name: string) => {
    setPlayerNameState(name);
  }, []);

  const getRecordsByRoom = useCallback((roomId: string) => {
    return records.filter(r => r.roomId === roomId).sort((a, b) => a.timestamp - b.timestamp);
  }, [records]);

  const getRecordsByTag = useCallback((tagId: string) => {
    return records.filter(r => r.tags.includes(tagId)).sort((a, b) => b.timestamp - a.timestamp);
  }, [records]);

  const deleteRecord = useCallback((recordId: string) => {
    setRecords(prev => {
      const newRecords = prev.filter(r => r.id !== recordId);
      console.log('[RecordContext] 删除记录:', recordId, '剩余:', newRecords.length);
      return newRecords;
    });
  }, []);

  const clearAllRecords = useCallback(() => {
    setRecords([]);
    console.log('[RecordContext] 清空所有记录');
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
      deleteRecord,
      clearAllRecords
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
