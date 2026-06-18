import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import { RecordItem, Room, PlaySession, ExportTemplate } from '@/types';
import { mockRecords as defaultMockRecords } from '@/data/mockRecords';
import { mockRooms } from '@/data/mockRooms';

const STORAGE_KEY_RECORDS = 'haunted_house_records_v2';
const STORAGE_KEY_SESSIONS = 'haunted_house_sessions';
const STORAGE_KEY_CURRENT_SESSION = 'haunted_house_current_session';
const STORAGE_KEY_TEMPLATES = 'haunted_house_export_templates';
const STORAGE_KEY_INITIALIZED = 'haunted_house_initialized';

interface RecordContextType {
  records: RecordItem[];
  rooms: Room[];
  sessions: PlaySession[];
  currentSessionId: string | null;
  currentSession: PlaySession | null;
  templates: ExportTemplate[];
  currentRoomId: string | null;
  selectedTags: string[];

  createSession: (name: string, playerName: string) => PlaySession;
  switchSession: (sessionId: string) => void;
  endCurrentSession: () => void;
  deleteSession: (sessionId: string) => void;

  sessionRecords: RecordItem[];
  addRecord: (record: Omit<RecordItem, 'id' | 'timestamp' | 'sessionId'>) => void;
  setCurrentRoom: (roomId: string) => void;
  toggleTag: (tagId: string) => void;
  clearSelectedTags: () => void;
  getRecordsByRoom: (roomId: string, sessionScope?: 'current' | 'all') => RecordItem[];
  getRecordsByTag: (tagId: string, sessionScope?: 'current' | 'all') => RecordItem[];
  deleteRecord: (recordId: string) => void;
  clearAllRecords: () => void;

  saveTemplate: (template: Omit<ExportTemplate, 'id' | 'createdAt'>) => void;
  deleteTemplate: (templateId: string) => void;
}

const RecordContext = createContext<RecordContextType | undefined>(undefined);

const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const buildMockSessionsWithRecords = (): { sessions: PlaySession[]; records: RecordItem[] } => {
  const now = Date.now();
  const session1: PlaySession = {
    id: 'session-mock-1',
    name: '内测场次 #1',
    playerName: '玩家A',
    startTime: now - 7200000,
    endTime: now - 6000000,
    isActive: false
  };
  const session2: PlaySession = {
    id: 'session-mock-2',
    name: '内测场次 #2',
    playerName: '玩家B',
    startTime: now - 5400000,
    endTime: now - 4200000,
    isActive: false
  };
  const session3: PlaySession = {
    id: 'session-mock-3',
    name: '今日试玩 - 待续',
    playerName: '玩家C',
    startTime: now - 1800000,
    isActive: true
  };

  const sessionMap: Record<string, string> = {
    '玩家A': 'session-mock-1',
    '玩家B': 'session-mock-2'
  };

  const recordsWithSession: RecordItem[] = defaultMockRecords.map((r, idx) => ({
    ...r,
    sessionId: sessionMap[r.playerName || ''] || 'session-mock-3'
  }));

  if (recordsWithSession.length > 0 && !recordsWithSession.some(r => r.sessionId === 'session-mock-3')) {
    recordsWithSession.push({
      id: `rec-${now}-preset`,
      sessionId: 'session-mock-3',
      roomId: 'room-1',
      roomName: '入口大厅',
      tags: ['tag-stay'],
      note: '（示例）玩家C在入口处停顿观察',
      timestamp: now - 1700000,
      playerName: '玩家C'
    });
  }

  return {
    sessions: [session1, session2, session3],
    records: recordsWithSession
  };
};

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const stored = Taro.getStorageSync(key);
    if (stored !== '' && stored !== null && stored !== undefined) {
      return stored as T;
    }
  } catch (error) {
    console.error('[RecordContext] 读取存储失败:', key, error);
  }
  return fallback;
};

export const RecordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialized = loadFromStorage<boolean>(STORAGE_KEY_INITIALIZED, false);

  const initialData = React.useMemo(() => {
    if (initialized) {
      return {
        records: loadFromStorage<RecordItem[]>(STORAGE_KEY_RECORDS, []),
        sessions: loadFromStorage<PlaySession[]>(STORAGE_KEY_SESSIONS, []),
        currentSessionId: loadFromStorage<string | null>(STORAGE_KEY_CURRENT_SESSION, null)
      };
    } else {
      const mock = buildMockSessionsWithRecords();
      return {
        records: mock.records,
        sessions: mock.sessions,
        currentSessionId: mock.sessions.find(s => s.isActive)?.id || mock.sessions[0]?.id || null
      };
    }
  }, [initialized]);

  const [records, setRecords] = useState<RecordItem[]>(initialData.records);
  const [sessions, setSessions] = useState<PlaySession[]>(initialData.sessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(initialData.currentSessionId);
  const [templates, setTemplates] = useState<ExportTemplate[]>(
    loadFromStorage<ExportTemplate[]>(STORAGE_KEY_TEMPLATES, [])
  );
  const [rooms] = useState<Room[]>(mockRooms);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    try {
      Taro.setStorageSync(STORAGE_KEY_INITIALIZED, true);
      Taro.setStorageSync(STORAGE_KEY_RECORDS, records);
      Taro.setStorageSync(STORAGE_KEY_SESSIONS, sessions);
      Taro.setStorageSync(STORAGE_KEY_CURRENT_SESSION, currentSessionId);
    } catch (error) {
      console.error('[RecordContext] 持久化写入失败:', error);
    }
  }, [records, sessions, currentSessionId]);

  useEffect(() => {
    try {
      Taro.setStorageSync(STORAGE_KEY_TEMPLATES, templates);
    } catch (error) {
      console.error('[RecordContext] 模板持久化失败:', error);
    }
  }, [templates]);

  const currentSession = useCallback((): PlaySession | null => {
    return sessions.find(s => s.id === currentSessionId) || null;
  }, [sessions, currentSessionId])();

  const sessionRecords = useMemo(() => {
    if (!currentSessionId) return [];
    return records.filter(r => r.sessionId === currentSessionId);
  }, [records, currentSessionId]);

  const createSession = useCallback((name: string, playerName: string): PlaySession => {
    const newSession: PlaySession = {
      id: `sess-${genId()}`,
      name,
      playerName,
      startTime: Date.now(),
      isActive: true
    };

    setSessions(prev => {
      const deactivated = prev.map(s => ({ ...s, isActive: false }));
      return [...deactivated, newSession];
    });
    setCurrentSessionId(newSession.id);
    setCurrentRoomId(null);
    setSelectedTags([]);
    console.log('[RecordContext] 新建场次:', newSession);
    return newSession;
  }, []);

  const switchSession = useCallback((sessionId: string) => {
    setSessions(prev =>
      prev.map(s => ({
        ...s,
        isActive: s.id === sessionId
      }))
    );
    setCurrentSessionId(sessionId);
    setCurrentRoomId(null);
    setSelectedTags([]);
    console.log('[RecordContext] 切换到场次:', sessionId);
  }, []);

  const endCurrentSession = useCallback(() => {
    if (!currentSessionId) return;
    setSessions(prev =>
      prev.map(s =>
        s.id === currentSessionId
          ? { ...s, endTime: Date.now(), isActive: false }
          : s
      )
    );
    console.log('[RecordContext] 结束场次:', currentSessionId);
  }, [currentSessionId]);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setRecords(prev => prev.filter(r => r.sessionId !== sessionId));
    if (currentSessionId === sessionId) {
      const remaining = sessions.filter(s => s.id !== sessionId);
      setCurrentSessionId(remaining[0]?.id || null);
    }
    console.log('[RecordContext] 删除场次及其记录:', sessionId);
  }, [currentSessionId, sessions]);

  const addRecord = useCallback((recordData: Omit<RecordItem, 'id' | 'timestamp' | 'sessionId'>) => {
    if (!currentSessionId) {
      console.error('[RecordContext] 无法添加记录：当前无激活场次');
      return;
    }
    const newRecord: RecordItem = {
      ...recordData,
      id: `rec-${genId()}`,
      sessionId: currentSessionId,
      timestamp: Date.now()
    };
    setRecords(prev => [...prev, newRecord]);
    console.log('[RecordContext] 添加记录:', newRecord);
  }, [currentSessionId]);

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

  const getRecordsByRoom = useCallback((roomId: string, sessionScope: 'current' | 'all' = 'all') => {
    let pool = records;
    if (sessionScope === 'current' && currentSessionId) {
      pool = records.filter(r => r.sessionId === currentSessionId);
    }
    return pool.filter(r => r.roomId === roomId).sort((a, b) => a.timestamp - b.timestamp);
  }, [records, currentSessionId]);

  const getRecordsByTag = useCallback((tagId: string, sessionScope: 'current' | 'all' = 'all') => {
    let pool = records;
    if (sessionScope === 'current' && currentSessionId) {
      pool = records.filter(r => r.sessionId === currentSessionId);
    }
    return pool.filter(r => r.tags.includes(tagId)).sort((a, b) => b.timestamp - a.timestamp);
  }, [records, currentSessionId]);

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

  const saveTemplate = useCallback((tpl: Omit<ExportTemplate, 'id' | 'createdAt'>) => {
    const newTpl: ExportTemplate = {
      ...tpl,
      id: `tpl-${genId()}`,
      createdAt: Date.now()
    };
    setTemplates(prev => [...prev, newTpl]);
    console.log('[RecordContext] 保存导出模板:', newTpl);
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  }, []);

  return (
    <RecordContext.Provider value={{
      records,
      rooms,
      sessions,
      currentSessionId,
      currentSession,
      templates,
      currentRoomId,
      selectedTags,

      createSession,
      switchSession,
      endCurrentSession,
      deleteSession,

      sessionRecords,
      addRecord,
      setCurrentRoom,
      toggleTag,
      clearSelectedTags,
      getRecordsByRoom,
      getRecordsByTag,
      deleteRecord,
      clearAllRecords,

      saveTemplate,
      deleteTemplate
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
