import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useRecord } from '@/store/RecordContext';
import { mockTags, getTagById } from '@/data/mockTags';
import StatCard from '@/components/StatCard';

interface RoomStat {
  roomId: string;
  roomName: string;
  count: number;
  topTags: { id: string; name: string; color: string; count: number }[];
}

const AnalysisPage: React.FC = () => {
  const { records, rooms } = useRecord();

  const stats = useMemo(() => {
    const totalRecords = records.length;
    const roomsWithRecords = new Set(records.map(r => r.roomId)).size;
    const avgPerRoom = roomsWithRecords > 0 ? (totalRecords / roomsWithRecords).toFixed(1) : '0';

    return { totalRecords, roomsWithRecords, avgPerRoom };
  }, [records]);

  const tagDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    records.forEach(record => {
      record.tags.forEach(tagId => {
        counts[tagId] = (counts[tagId] || 0) + 1;
      });
    });

    const total = Object.values(counts).reduce((sum, c) => sum + c, 0);

    return mockTags
      .filter(tag => counts[tag.id])
      .map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        count: counts[tag.id] || 0,
        percentage: total > 0 ? Math.round((counts[tag.id] || 0) / total * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  const roomRank = useMemo(() => {
    const roomStats: Record<string, RoomStat> = {};

    records.forEach(record => {
      if (!roomStats[record.roomId]) {
        roomStats[record.roomId] = {
          roomId: record.roomId,
          roomName: record.roomName,
          count: 0,
          topTags: []
        };
      }
      roomStats[record.roomId].count += 1;

      const tagCounts: Record<string, number> = {};
      record.tags.forEach(tagId => {
        tagCounts[tagId] = (tagCounts[tagId] || 0) + 1;
      });
    });

    records.forEach(record => {
      record.tags.forEach(tagId => {
        const existing = roomStats[record.roomId].topTags.find(t => t.id === tagId);
        if (existing) {
          existing.count += 1;
        } else {
          const tag = getTagById(tagId);
          if (tag) {
            roomStats[record.roomId].topTags.push({
              id: tagId,
              name: tag.name,
              color: tag.color,
              count: 1
            });
          }
        }
      });
    });

    return Object.values(roomStats)
      .map(room => ({
        ...room,
        topTags: room.topTags.sort((a, b) => b.count - a.count).slice(0, 3)
      }))
      .sort((a, b) => b.count - a.count);
  }, [records]);

  const handleRoomClick = (roomId: string) => {
    Taro.navigateTo({
      url: `/pages/room-detail/index?roomId=${roomId}`
    });
  };

  return (
    <View className={styles.page}>
      <View className="page-container">
        <View className={styles.statsRow}>
          <StatCard
            title="总记录数"
            value={stats.totalRecords}
            subtitle="所有试玩记录"
            color="#7B2FFD"
          />
          <StatCard
            title="涉及房间"
            value={stats.roomsWithRecords}
            subtitle={`共 ${rooms.length} 个房间`}
            color="#00F0FF"
          />
        </View>

        <View className={styles.statsRow}>
          <StatCard
            title="平均每房间"
            value={stats.avgPerRoom}
            subtitle="问题密度"
            color="#FFB020"
          />
          <StatCard
            title="惊吓点"
            value={records.filter(r => r.tags.some(t => t.includes('scare'))).length}
            subtitle="有效惊吓次数"
            color="#FF2D55"
          />
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionDot} />
            <Text>问题类型分布</Text>
          </View>
          <View className={styles.distributionCard}>
            {tagDistribution.map(item => (
              <View key={item.id} className={styles.distItem}>
                <View className={styles.distHeader}>
                  <View className={styles.distLabel}>
                    <View className={styles.distDot} style={{ backgroundColor: item.color }} />
                    <Text>{item.name}</Text>
                  </View>
                  <Text className={styles.distValue}>
                    {item.count} 次 ({item.percentage}%)
                  </Text>
                </View>
                <View className={styles.distBar}>
                  <View
                    className={styles.distFill}
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color
                    }}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionDot} />
            <Text>房间卡点排行</Text>
          </View>
          <View className={styles.roomRankList}>
            {roomRank.map((room, index) => (
              <View
                key={room.roomId}
                className={styles.roomRankItem}
                onClick={() => handleRoomClick(room.roomId)}
              >
                <View className={`${styles.rankNumber} ${index < 3 ? styles.rankNumberTop : ''}`}>
                  <Text className={styles.rankText}>{index + 1}</Text>
                </View>
                <View className={styles.roomInfo}>
                  <Text className={styles.roomName}>{room.roomName}</Text>
                  <View className={styles.roomTags}>
                    {room.topTags.map(tag => (
                      <View
                        key={tag.id}
                        className={styles.miniTag}
                        style={{
                          backgroundColor: `${tag.color}20`,
                          color: tag.color
                        }}
                      >
                        <Text>{tag.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View className={styles.problemCount}>
                  <Text className={styles.problemNumber}>{room.count}</Text>
                  <Text className={styles.problemLabel}>个问题</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default AnalysisPage;
