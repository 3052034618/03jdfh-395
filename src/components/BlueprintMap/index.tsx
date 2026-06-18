import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import { Room, RecordItem } from '@/types';
import { getTagById } from '@/data/mockTags';

interface BlueprintMapProps {
  rooms: Room[];
  records?: RecordItem[];
  selectedRoomId?: string | null;
  onRoomClick?: (roomId: string) => void;
  showTrail?: boolean;
}

interface TrailPoint {
  recordId: string;
  roomId: string;
  roomName: string;
  timestamp: number;
  order: number;
  x: number;
  y: number;
  color: string;
}

const BlueprintMap: React.FC<BlueprintMapProps> = ({
  rooms,
  records = [],
  selectedRoomId,
  onRoomClick,
  showTrail = true
}) => {
  const getRoomById = (roomId: string): Room | undefined => {
    return rooms.find(r => r.id === roomId);
  };

  const getRoomRecords = (roomId: string) => {
    return records.filter(r => r.roomId === roomId);
  };

  const getRecordMainColor = (record: RecordItem): string => {
    if (record.tags.length === 0) return '#7B2FFD';
    const tag = getTagById(record.tags[0]);
    return tag?.color || '#7B2FFD';
  };

  const getRoomMainColor = (roomId: string): string => {
    const roomRecords = getRoomRecords(roomId);
    if (roomRecords.length === 0) return '#2A2A35';

    const tagCount: Record<string, number> = {};
    roomRecords.forEach(record => {
      record.tags.forEach(tagId => {
        tagCount[tagId] = (tagCount[tagId] || 0) + 1;
      });
    });

    let maxTag = '';
    let maxCount = 0;
    Object.entries(tagCount).forEach(([tagId, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxTag = tagId;
      }
    });

    const tag = getTagById(maxTag);
    return tag?.color || '#2A2A35';
  };

  const trailPoints = useMemo<TrailPoint[]>(() => {
    const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);
    const offsetMap: Record<string, number> = {};

    return sortedRecords.map((record, index) => {
      const room = getRoomById(record.roomId);
      if (!room) return null;

      const visitCount = (offsetMap[record.roomId] || 0) + 1;
      offsetMap[record.roomId] = visitCount;

      const baseX = room.x + room.width / 2;
      const baseY = room.y + room.height / 2;

      const offsetAngle = (visitCount - 1) * 45;
      const offsetRadius = (visitCount - 1) * 12;
      const offsetX = Math.cos(offsetAngle * Math.PI / 180) * offsetRadius;
      const offsetY = Math.sin(offsetAngle * Math.PI / 180) * offsetRadius;

      return {
        recordId: record.id,
        roomId: record.roomId,
        roomName: record.roomName,
        timestamp: record.timestamp,
        order: index + 1,
        x: baseX + offsetX,
        y: baseY + offsetY,
        color: getRecordMainColor(record)
      };
    }).filter(Boolean) as TrailPoint[];
  }, [records, rooms]);

  const renderTrailLines = () => {
    if (!showTrail || trailPoints.length < 2) return null;

    const lines = [];
    for (let i = 0; i < trailPoints.length - 1; i++) {
      const from = trailPoints[i];
      const to = trailPoints[i + 1];
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;

      lines.push(
        <View
          key={`trail-${i}`}
          className={styles.trailLine}
          style={{
            left: from.x + 'rpx',
            top: from.y + 'rpx',
            width: distance + 'rpx',
            height: '4rpx',
            transform: `rotate(${angle}deg)`,
            transformOrigin: '0 50%',
            background: `linear-gradient(90deg, ${from.color}, ${to.color})`,
            opacity: 0.6
          }}
        />
      );
    }
    return lines;
  };

  const renderTrailDots = () => {
    if (!showTrail || trailPoints.length === 0) return null;

    return trailPoints.map((point, index) => (
      <View
        key={`dot-${point.recordId}`}
        className={styles.trailDot}
        style={{
          left: (point.x - 10) + 'rpx',
          top: (point.y - 10) + 'rpx',
          backgroundColor: point.color,
          boxShadow: `0 0 10rpx ${point.color}`
        }}
      >
        <Text className={styles.trailDotText}>{index + 1}</Text>
      </View>
    ));
  };

  return (
    <View className={styles.blueprintContainer}>
      <ScrollView scrollX scrollY className={styles.scrollContainer}>
        <View className={styles.mapWrapper}>
          <View className={styles.gridBg} />

          {rooms.map((room) => {
            const roomRecords = getRoomRecords(room.id);
            const mainColor = getRoomMainColor(room.id);
            const isSelected = selectedRoomId === room.id;
            const recordCount = roomRecords.length;

            return (
              <View
                key={room.id}
                className={`${styles.roomBlock} ${isSelected ? styles.selected : ''}`}
                style={{
                  left: room.x + 'rpx',
                  top: room.y + 'rpx',
                  width: room.width + 'rpx',
                  height: room.height + 'rpx',
                  borderColor: mainColor,
                  boxShadow: isSelected ? `0 0 20rpx ${mainColor}` : 'none'
                }}
                onClick={() => onRoomClick?.(room.id)}
              >
                <Text className={styles.roomNumber}>{room.order}</Text>
                <Text className={styles.roomLabel}>{room.name}</Text>
                {recordCount > 0 && (
                  <View className={styles.recordBadge} style={{ backgroundColor: mainColor }}>
                    <Text className={styles.badgeCount}>{recordCount}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {renderTrailLines()}
          {renderTrailDots()}
        </View>
      </ScrollView>
      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ backgroundColor: '#FFB020' }} />
          <Text className={styles.legendText}>停留</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ backgroundColor: '#FF2D55' }} />
          <Text className={styles.legendText}>惊吓</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ backgroundColor: '#00F0FF' }} />
          <Text className={styles.legendText}>错过</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={styles.legendDot} style={{ backgroundColor: '#20D080' }} />
          <Text className={styles.legendText}>困惑</Text>
        </View>
      </View>
    </View>
  );
};

export default BlueprintMap;
