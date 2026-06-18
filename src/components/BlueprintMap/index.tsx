import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import styles from './index.module.scss';
import { Room, RecordItem } from '@/types';
import { getTagById } from '@/data/mockTags';
import { formatTime } from '@/utils';
import TagButton from '@/components/TagButton';

interface BlueprintMapProps {
  rooms: Room[];
  records?: RecordItem[];
  selectedRoomId?: string | null;
  onRoomClick?: (roomId: string) => void;
  showTrail?: boolean;
  enablePlayback?: boolean;
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
  tags: string[];
  note: string;
  playerName: string;
}

const BlueprintMap: React.FC<BlueprintMapProps> = ({
  rooms,
  records = [],
  selectedRoomId,
  onRoomClick,
  showTrail = true,
  enablePlayback = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStep, setPlaybackStep] = useState(-1);
  const [selectedPoint, setSelectedPoint] = useState<TrailPoint | null>(null);
  const playbackTimer = useRef<number | null>(null);

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
      const offsetRadius = (visitCount - 1) * 14;
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
        color: getRecordMainColor(record),
        tags: record.tags,
        note: record.note,
        playerName: record.playerName || '匿名'
      };
    }).filter(Boolean) as TrailPoint[];
  }, [records, rooms]);

  useEffect(() => {
    if (isPlaying && playbackStep < trailPoints.length - 1) {
      playbackTimer.current = window.setTimeout(() => {
        setPlaybackStep(prev => prev + 1);
      }, 1200);
    } else if (playbackStep >= trailPoints.length - 1 && isPlaying) {
      setIsPlaying(false);
    }

    return () => {
      if (playbackTimer.current) {
        clearTimeout(playbackTimer.current);
        playbackTimer.current = null;
      }
    };
  }, [isPlaying, playbackStep, trailPoints.length]);

  const handlePlayToggle = () => {
    if (playbackStep >= trailPoints.length - 1) {
      setPlaybackStep(-1);
    }
    setIsPlaying(prev => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setPlaybackStep(-1);
    setSelectedPoint(null);
  };

  const handlePointClick = (point: TrailPoint, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setSelectedPoint(prev => prev?.recordId === point.recordId ? null : point);
  };

  const isPointVisible = (index: number): boolean => {
    if (!isPlaying && playbackStep === -1) return true;
    return index <= playbackStep;
  };

  const isLineVisible = (index: number): boolean => {
    if (!isPlaying && playbackStep === -1) return true;
    return index < playbackStep;
  };

  const renderTrailLines = () => {
    if (!showTrail || trailPoints.length < 2) return null;

    const lines = [];
    for (let i = 0; i < trailPoints.length - 1; i++) {
      if (!isLineVisible(i)) continue;
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
            opacity: 0.7
          }}
        />
      );
    }
    return lines;
  };

  const renderTrailDots = () => {
    if (!showTrail || trailPoints.length === 0) return null;

    return trailPoints.map((point, index) => {
      const visible = isPointVisible(index);
      const isActive = selectedPoint?.recordId === point.recordId;
      const isCurrentStep = isPlaying && playbackStep === index;

      return (
        <React.Fragment key={`dot-wrap-${point.recordId}`}>
          <View
            key={`dot-${point.recordId}`}
            className={`${styles.trailDot} ${isActive ? styles.dotActive : ''} ${isCurrentStep ? styles.dotPulse : ''}`}
            style={{
              left: (point.x - 12) + 'rpx',
              top: (point.y - 12) + 'rpx',
              backgroundColor: point.color,
              boxShadow: isCurrentStep
                ? `0 0 20rpx ${point.color}, 0 0 40rpx ${point.color}`
                : isActive
                  ? `0 0 16rpx ${point.color}`
                  : `0 0 8rpx ${point.color}`,
              opacity: visible ? 1 : 0.15,
              transform: isCurrentStep ? 'scale(1.3)' : (isActive ? 'scale(1.2)' : 'scale(1)')
            }}
            onClick={(e) => handlePointClick(point, e)}
          >
            <Text className={styles.trailDotText}>{index + 1}</Text>
          </View>
        </React.Fragment>
      );
    });
  };

  return (
    <View className={styles.blueprintContainer} onClick={() => setSelectedPoint(null)}>
      {enablePlayback && trailPoints.length > 0 && (
        <View className={styles.playbackBar} onClick={(e) => e.stopPropagation()}>
          <View
            className={`${styles.playBtn} ${isPlaying ? styles.playing : ''}`}
            onClick={handlePlayToggle}
          >
            <Text className={styles.playBtnText}>{isPlaying ? '⏸' : '▶'}</Text>
          </View>
          <View className={styles.progressBar}>
            <View
              className={styles.progressFill}
              style={{
                width: `${playbackStep >= 0 ? ((playbackStep + 1) / trailPoints.length * 100) : 0}%`
              }}
            />
            {trailPoints.map((_, i) => (
              <View
                key={`prog-${i}`}
                className={`${styles.progressDot} ${i <= playbackStep ? styles.progressDotActive : ''}`}
                style={{ left: `${(i / (trailPoints.length - 1 || 1)) * 100}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setPlaybackStep(i);
                  setIsPlaying(false);
                }}
              />
            ))}
          </View>
          <View className={styles.resetBtn} onClick={handleReset}>
            <Text className={styles.resetBtnText}>↺</Text>
          </View>
          <Text className={styles.playbackStepText}>
            {playbackStep >= 0 ? playbackStep + 1 : 0}/{trailPoints.length}
          </Text>
        </View>
      )}

      <ScrollView scrollX scrollY className={styles.scrollContainer}>
        <View className={styles.mapWrapper}>
          <View className={styles.gridBg} />

          {rooms.map((room) => {
            const roomRecords = getRoomRecords(room.id);
            const mainColor = getRoomMainColor(room.id);
            const isSelected = selectedRoomId === room.id;
            const recordCount = roomRecords.length;
            const isHighlightedRoom = isPlaying
              && playbackStep >= 0
              && trailPoints[playbackStep]?.roomId === room.id;

            return (
              <View
                key={room.id}
                className={`${styles.roomBlock} ${isSelected ? styles.selected : ''} ${isHighlightedRoom ? styles.roomHighlight : ''}`}
                style={{
                  left: room.x + 'rpx',
                  top: room.y + 'rpx',
                  width: room.width + 'rpx',
                  height: room.height + 'rpx',
                  borderColor: isHighlightedRoom ? trailPoints[playbackStep]?.color : mainColor,
                  boxShadow: isHighlightedRoom
                    ? `0 0 30rpx ${trailPoints[playbackStep]?.color || mainColor}`
                    : (isSelected ? `0 0 20rpx ${mainColor}` : 'none'),
                  opacity: isPlaying && !isHighlightedRoom ? 0.55 : 1
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

      {selectedPoint && (
        <View
          className={styles.pointPopup}
          style={{
            left: Math.min(Math.max(selectedPoint.x - 90, 20), 320) + 'rpx',
            top: Math.max(selectedPoint.y - 180, 30) + 'rpx'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <View className={styles.popupHeader}>
            <Text className={styles.popupRoom}>{selectedPoint.roomName}</Text>
            <Text className={styles.popupTime}>{formatTime(selectedPoint.timestamp)}</Text>
          </View>
          <View className={styles.popupTags}>
            {selectedPoint.tags.map(tid => {
              const tag = getTagById(tid);
              return tag ? (
                <TagButton key={tid} name={tag.name} color={tag.color} size="small" selected />
              ) : null;
            })}
          </View>
          {selectedPoint.note && (
            <Text className={styles.popupNote}>{selectedPoint.note}</Text>
          )}
          <Text className={styles.popupPlayer}>— {selectedPoint.playerName}</Text>
          <View className={styles.popupArrow} />
        </View>
      )}

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
