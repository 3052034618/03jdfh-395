import React, { useState, useMemo } from 'react';
import { View, Text, Textarea, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useRecord } from '@/store/RecordContext';
import { mockTags } from '@/data/mockTags';
import { getRoomById } from '@/data/mockRooms';
import TagButton from '@/components/TagButton';
import BlueprintMap from '@/components/BlueprintMap';
import RecordItemComponent from '@/components/RecordItem';
import { formatTime } from '@/utils';

const RecordPage: React.FC = () => {
  const {
    rooms,
    records,
    currentRoomId,
    selectedTags,
    playerName,
    addRecord,
    setCurrentRoom,
    toggleTag,
    clearSelectedTags
  } = useRecord();

  const [note, setNote] = useState('');
  const [sessionStartTime] = useState(Date.now());

  const currentRoom = useMemo(() => {
    return currentRoomId ? getRoomById(currentRoomId) : null;
  }, [currentRoomId]);

  const sessionRecords = useMemo(() => {
    return records
      .filter(r => r.timestamp >= sessionStartTime)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [records, sessionStartTime]);

  const tagGroups = useMemo(() => {
    const groups: Record<string, typeof mockTags> = {
      '行为观察': mockTags.filter(t => t.type === 'stay' || t.type === 'loop'),
      '线索/理解': mockTags.filter(t => t.type === 'miss' || t.type === 'understand'),
      '惊吓反应': mockTags.filter(t => t.type === 'scare'),
      '精彩瞬间': mockTags.filter(t => t.type === 'best')
    };
    return groups;
  }, []);

  const canSubmit = currentRoomId && (selectedTags.length > 0 || note.trim().length > 0);

  const handleSubmit = () => {
    if (!currentRoomId || !currentRoom) return;
    if (selectedTags.length === 0 && !note.trim()) {
      Taro.showToast({ title: '请选择标签或输入备注', icon: 'none' });
      return;
    }

    addRecord({
      roomId: currentRoomId,
      roomName: currentRoom.name,
      tags: [...selectedTags],
      note: note.trim(),
      playerName
    });

    setNote('');
    clearSelectedTags();

    Taro.showToast({ title: '记录已保存', icon: 'success' });
    console.log('[RecordPage] 提交记录:', { room: currentRoom.name, tags: selectedTags, note });
  };

  const handleRoomClick = (roomId: string) => {
    setCurrentRoom(roomId);
  };

  const sessionDuration = useMemo(() => {
    const diff = Math.floor((Date.now() - sessionStartTime) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    return `${mins}分${secs}秒`;
  }, [sessionStartTime]);

  return (
    <View className={styles.page}>
      <View className="page-container">
        <View className={styles.header}>
          <View className={styles.playerRow}>
            <Text className={styles.playerName}>{playerName}</Text>
            <Text className={styles.sessionTime}>已记录 {sessionDuration}</Text>
          </View>
          <View className={styles.currentRoom}>
            <Text className={styles.currentRoomLabel}>当前房间</Text>
            <Text className={styles.currentRoomName}>
              {currentRoom ? currentRoom.name : '请选择房间'}
            </Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionDot} />
            <Text>鬼屋蓝图</Text>
          </View>
          <BlueprintMap
            rooms={rooms}
            records={sessionRecords}
            selectedRoomId={currentRoomId}
            onRoomClick={handleRoomClick}
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
            <Text className={styles.timelineTitle}>本次记录轨迹</Text>
            <Text className={styles.timelineCount}>{sessionRecords.length} 条</Text>
          </View>
          {sessionRecords.length === 0 ? (
            <View className={styles.emptyState}>
              <Text className={styles.emptyText}>暂无记录，开始标注吧</Text>
            </View>
          ) : (
            sessionRecords.map(record => (
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
          {currentRoom ? `保存到 ${currentRoom.name}` : '请先选择房间'}
        </Button>
      </View>
    </View>
  );
};

export default RecordPage;
