import React from 'react';
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

const BlueprintMap: React.FC<BlueprintMapProps> = ({
  rooms,
  records = [],
  selectedRoomId,
  onRoomClick,
  showTrail = true
}) => {
  const getRoomRecords = (roomId: string) => {
    return records.filter(r => r.roomId === roomId);
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

  const sortedRooms = [...rooms].sort((a, b) => a.order - b.order);

  return (
    <View className={styles.blueprintContainer}>
      <ScrollView scrollX scrollY className={styles.scrollContainer}>
        <View className={styles.mapWrapper}>
          <View className={styles.gridBg} />
          {sortedRooms.map((room, index) => {
            const roomRecords = getRoomRecords(room.id);
            const mainColor = getRoomMainColor(room.id);
            const isSelected = selectedRoomId === room.id;
            const recordCount = roomRecords.length;

            return (
              <View key={room.id}>
                {showTrail && index < sortedRooms.length - 1 && (
                  <View
                    className={styles.trailLine}
                    style={{
                      left: (room.x + room.width / 2) + 'rpx',
                      top: (room.y + room.height / 2) + 'rpx',
                      width: Math.abs(sortedRooms[index + 1].x - room.x) + 'rpx',
                      height: '4rpx',
                      background: `linear-gradient(90deg, ${mainColor}, ${getRoomMainColor(sortedRooms[index + 1].id)})`,
                      opacity: 0.5
                    }}
                  />
                )}
                <View
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
              </View>
            );
          })}
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
