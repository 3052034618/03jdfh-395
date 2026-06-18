import React, { useState, useMemo } from 'react';
import { View, Text, Textarea, Button, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useRecord } from '@/store/RecordContext';
import { mockTags } from '@/data/mockTags';
import { getRoomById } from '@/data/mockRooms';
import TagButton from '@/components/TagButton';
import BlueprintMap from '@/components/BlueprintMap';
import RecordItemComponent from '@/components/RecordItem';
import { formatDuration } from '@/utils';
import { PlaySession } from '@/types';

const RecordPage: React.FC = () => {
  const {
    rooms,
    sessions,
    currentSession,
    currentSessionId,
    sessionRecords,
    getRecordsBySession,
    currentRoomId,
    selectedTags,
    addRecord,
    setCurrentRoom,
    toggleTag,
    clearSelectedTags,
    createSession,
    switchSession,
    endCurrentSession,
    getRecordsByRoom
  } = useRecord();

  const [note, setNote] = useState('');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPlayer, setNewPlayer] = useState('');
  const [tick, setTick] = useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const currentRoom = useMemo(() => {
    return currentRoomId ? getRoomById(currentRoomId) : null;
  }, [currentRoomId]);

  const sortedRecords = useMemo(() => {
    return [...sessionRecords].sort((a, b) => b.timestamp - a.timestamp);
  }, [sessionRecords]);

  const tagGroups = useMemo(() => {
    const groups: Record<string, typeof mockTags> = {
      '行为观察': mockTags.filter(t => t.type === 'stay' || t.type === 'loop'),
      '线索/理解': mockTags.filter(t => t.type === 'miss' || t.type === 'understand'),
      '惊吓反应': mockTags.filter(t => t.type === 'scare'),
      '精彩瞬间': mockTags.filter(t => t.type === 'best')
    };
    return groups;
  }, []);

  const canSubmit = currentSessionId && currentRoomId && (selectedTags.length > 0 || note.trim().length > 0);

  const sessionDuration = useMemo(() => {
    if (!currentSession) return '0分0秒';
    const end = currentSession.endTime || Date.now();
    const diff = Math.floor((end - currentSession.startTime) / 1000);
    return formatDuration(diff);
  }, [currentSession, tick]);

  const handleSubmit = () => {
    if (!currentSessionId || !currentRoom || !currentSession) {
      Taro.showToast({ title: '请先选择场次和房间', icon: 'none' });
      return;
    }
    if (selectedTags.length === 0 && !note.trim()) {
      Taro.showToast({ title: '请选择标签或输入备注', icon: 'none' });
      return;
    }

    addRecord({
      roomId: currentRoomId,
      roomName: currentRoom.name,
      tags: [...selectedTags],
      note: note.trim(),
      playerName: currentSession.playerName
    });

    setNote('');
    clearSelectedTags();

    Taro.showToast({ title: '记录已保存', icon: 'success' });
    console.log('[RecordPage] 提交记录:', { session: currentSession.name, room: currentRoom.name, tags: selectedTags, note });
  };

  const handleRoomClick = (roomId: string) => {
    setCurrentRoom(roomId);
  };

  const openSheet = () => {
    setNewName('');
    setNewPlayer(currentSession?.playerName || '');
    setSheetVisible(true);
  };

  const closeSheet = () => setSheetVisible(false);

  const handleCreateSession = () => {
    const name = newName.trim() || `场次 #${sessions.length + 1}`;
    const player = newPlayer.trim() || '匿名玩家';
    createSession(name, player);
    closeSheet();
    Taro.showToast({ title: '已新建场次', icon: 'success' });
  };

  const handleSwitchSession = (sid: string) => {
    switchSession(sid);
    closeSheet();
  };

  const handleEndSession = () => {
    if (!currentSessionId) return;
    Taro.showModal({
      title: '结束当前场次',
      content: '确认结束当前试玩场次吗？结束后可新建或切换到其他场次。',
      success: (res) => {
        if (res.confirm) {
          endCurrentSession();
          Taro.showToast({ title: '场次已结束', icon: 'success' });
        }
      }
    });
  };

  const renderSessionSheet = () => (
    <View className={styles.sessionSheet} onClick={(e) => e.stopPropagation()}>
      <View className={styles.sheetHeader}>
        <Text className={styles.sheetTitle}>场次管理</Text>
        <View className={styles.sheetClose} onClick={closeSheet}>
          <Text className={styles.sheetCloseText}>×</Text>
        </View>
      </View>

      <View className={styles.formRow}>
        <Text className={styles.formLabel}>场次名称</Text>
        <Input
          className={styles.formInput}
          placeholder={`场次 #${sessions.length + 1}`}
          value={newName}
          onInput={(e) => setNewName(e.detail.value)}
        />
      </View>
      <View className={styles.formRow}>
        <Text className={styles.formLabel}>玩家名称</Text>
        <Input
          className={styles.formInput}
          placeholder="玩家昵称或编号"
          value={newPlayer}
          onInput={(e) => setNewPlayer(e.detail.value)}
        />
      </View>
      <Button className={styles.sheetPrimaryBtn} onClick={handleCreateSession}>
        ＋ 新建场次
      </Button>

      <Text className={styles.sheetListTitle}>切换已有场次</Text>
      {sessions.length === 0 && (
        <View className={styles.emptyState}>
          <Text className={styles.emptyText}>暂无历史场次</Text>
        </View>
      )}
      {sessions.map((s: PlaySession) => {
        const sessRecs = getRecordsBySession(s.id);
        const sessCount = sessRecs.length;
        const sessDuration = Math.floor(((s.endTime || Date.now()) - s.startTime) / 1000);
        return (
          <View
            key={s.id}
            className={`${styles.sessionListItem} ${s.id === currentSessionId ? styles.active : ''}`}
            onClick={() => handleSwitchSession(s.id)}
          >
            <View className={styles.sessionListRow}>
              <Text className={styles.sessionListName}>{s.name}</Text>
              {s.id === currentSessionId && (
                <Text className={styles.sessionListActive}>当前</Text>
              )}
              {s.endTime && s.id !== currentSessionId && (
                <Text className={styles.sessionListActive} style={{ background: 'rgba(255,255,255,0.1)', color: '#A0A0B0' }}>已结束</Text>
              )}
            </View>
            <View className={styles.sessionListMeta}>
              <Text className={styles.sessionListMetaText}>玩家：{s.playerName}</Text>
              <Text className={styles.sessionListMetaText}>
                {formatDuration(sessDuration)}
              </Text>
              <Text className={styles.sessionListMetaText}>
                记录 {sessCount} 条
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  if (!currentSession || !currentSessionId) {
    return (
      <View className={styles.page}>
        <View className="page-container">
          <View className={styles.noSessionBar}>
            <Text className={styles.noSessionTitle}>暂无试玩场次</Text>
            <Text className={styles.noSessionDesc}>
              新建一场试玩，开始记录玩家的真实走法和受惊反应
            </Text>
            <Button className={styles.newSessionBtn} onClick={openSheet}>
              新建试玩场次
            </Button>
          </View>
        </View>
        {sheetVisible && Taro.showActionSheet ? null : null}
        {sheetVisible && Taro.atMessage ? null : null}
        {sheetVisible &&
          Taro.showModal ? null : null
        }
        {sheetVisible && (
          <View
            style={{
              position: 'fixed',
              left: 0, right: 0, top: 0, bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'flex-end'
            }}
            onClick={closeSheet}
          >
            {renderSessionSheet()}
          </View>
        )}
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className="page-container">
        <View className={styles.sessionBar}>
          <View className={styles.sessionRow}>
            <Text className={styles.sessionName}>{currentSession.name}</Text>
            <View className={styles.sessionActions}>
              <View className={styles.sessionIconBtn} onClick={handleEndSession} title="结束场次">
                <Text className={styles.sessionIconText}>⏹</Text>
              </View>
              <View className={styles.sessionIconBtn} onClick={openSheet} title="场次管理">
                <Text className={styles.sessionIconText}>☰</Text>
              </View>
            </View>
          </View>
          <View className={styles.sessionMeta}>
            <View className={styles.playerTag}>
              <View className={styles.playerDot} />
              <Text className={styles.playerText}>{currentSession.playerName}</Text>
            </View>
            <Text className={styles.durationText}>{sessionDuration}</Text>
          </View>
          <View className={styles.currentRoom}>
            <Text className={styles.currentRoomLabel}>当前房间</Text>
            <Text className={styles.currentRoomName}>
              {currentRoom ? currentRoom.name : '点击下方蓝图选择房间'}
            </Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionDot} />
            <Text>鬼屋蓝图（点击回放按钮查看路线）</Text>
          </View>
          <BlueprintMap
            rooms={rooms}
            records={sortedRecords}
            selectedRoomId={currentRoomId}
            onRoomClick={handleRoomClick}
            enablePlayback
          />
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionDot} />
            <Text>行为标签</Text>
          </View>
          {Object.entries(tagGroups).map(([groupName, tags]) => (
            <View key={groupName} className={styles.tagGroup}>
              <Text className={styles.tagGroupTitle}>{groupName}</Text>
              <View className={styles.tagList}>
                {tags.map(tag => (
                  <TagButton
                    key={tag.id}
                    name={tag.name}
                    color={tag.color}
                    selected={selectedTags.includes(tag.id)}
                    onClick={() => toggleTag(tag.id)}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionDot} />
            <Text>观察备注</Text>
          </View>
          <Textarea
            className={styles.noteInput}
            placeholder="记录玩家的具体反应，如：以为厨房门后有怪物所以不敢进入"
            value={note}
            onInput={(e) => setNote(e.detail.value)}
            maxlength={200}
          />
        </View>

        <View className={styles.timelineSection}>
          <View className={styles.timelineHeader}>
            <Text className={styles.timelineTitle}>本场记录轨迹</Text>
            <Text className={styles.timelineCount}>
              {sortedRecords.length} 条
            </Text>
          </View>
          {sortedRecords.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyText}>本场暂无记录，开始标注吧</Text>
            </View>
          ) : (
            sortedRecords.map(record => (
              <RecordItemComponent
                key={record.id}
                record={record}
                showTime
              />
            ))
          )}
        </View>
      </View>

      <View className={styles.submitBar}>
        <Button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {!currentSessionId
            ? '请先选择场次'
            : currentRoom
              ? `保存到 ${currentRoom.name}`
              : '请先选择房间'}
        </Button>
      </View>

      {sheetVisible && (
        <View
          style={{
            position: 'fixed',
            left: 0, right: 0, top: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'flex-end'
          }}
          onClick={closeSheet}
        >
          {renderSessionSheet()}
        </View>
      )}
    </View>
  );
};

export default RecordPage;
