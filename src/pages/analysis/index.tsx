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
  uniquePlayers: number;
  topTags: { id: string; name: string; color: string; count: number; uniquePlayers: number }[];
}

const AnalysisPage: React.FC = () => {
  const { records, rooms } = useRecord();

  const stats = useMemo(() => {
    const totalRecords = records.length;
    const roomsWithRecords = new Set(records.map(r => r.roomId)).size;
    const avgPerRoom = roomsWithRecords > 0 ? (totalRecords / roomsWithRecords).toFixed(1) : '0';
    const uniquePlayers = new Set(records.map(r => r.playerName).filter(Boolean)).size;

    return { totalRecords, roomsWithRecords, avgPerRoom, uniquePlayers };
  }, [records]);

  const tagDistribution = useMemo(() => {
    const playerCounts: Record<string, Set<string>> = {};
    const occurrenceCounts: Record<string, number> = {};

    records.forEach(record => {
      const player = record.playerName || '匿名';
      record.tags.forEach(tagId => {
        occurrenceCounts[tagId] = (occurrenceCounts[tagId] || 0) + 1;
        if (!playerCounts[tagId]) {
          playerCounts[tagId] = new Set();
        }
        playerCounts[tagId].add(player);
      });
    });

    const totalUniquePlayers = Object.values(playerCounts).reduce(
      (sum, players) => sum + players.size, 0
    );

    return mockTags
      .filter(tag => occurrenceCounts[tag.id])
      .map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        count: occurrenceCounts[tag.id] || 0,
        uniquePlayers: playerCounts[tag.id]?.size || 0,
        percentage: totalUniquePlayers > 0
          ? Math.round((playerCounts[tag.id]?.size || 0) / totalUniquePlayers * 100)
          : 0
      }))
      .sort((a, b) => b.uniquePlayers - a.uniquePlayers);
  }, [records]);

  const roomRank = useMemo(() => {
    const roomStats: Record<string, RoomStat> = {};
    const roomTagPlayers: Record<string, Record<string, Set<string>>> = {};
    const roomTagCounts: Record<string, Record<string, number>> = {};

    records.forEach(record => {
      const player = record.playerName || '匿名';

      if (!roomStats[record.roomId]) {
        roomStats[record.roomId] = {
          roomId: record.roomId,
          roomName: record.roomName,
          count: 0,
          uniquePlayers: 0,
          topTags: []
        };
        roomTagPlayers[record.roomId] = {};
        roomTagCounts[record.roomId] = {};
      }
      roomStats[record.roomId].count += 1;

      record.tags.forEach(tagId => {
        if (!roomTagPlayers[record.roomId][tagId]) {
          roomTagPlayers[record.roomId][tagId] = new Set();
        }
        roomTagPlayers[record.roomId][tagId].add(player);
        roomTagCounts[record.roomId][tagId] = (roomTagCounts[record.roomId][tagId] || 0) + 1;
      });
    });

    Object.keys(roomStats).forEach(roomId => {
      const roomPlayers = new Set<string>();
      records
        .filter(r => r.roomId === roomId)
        .forEach(r => roomPlayers.add(r.playerName || '匿名'));
      roomStats[roomId].uniquePlayers = roomPlayers.size;

      const tagStats = Object.entries(roomTagPlayers[roomId]).map(([tagId, players]) => {
        const tag = getTagById(tagId);
        return {
          id: tagId,
          name: tag?.name || tagId,
          color: tag?.color || '#7B2FFD',
          count: roomTagCounts[roomId][tagId] || 0,
          uniquePlayers: players.size
        };
      });

      roomStats[roomId].topTags = tagStats
        .sort((a, b) => b.uniquePlayers - a.uniquePlayers)
        .slice(0, 3);
    });

    return Object.values(roomStats)
      .sort((a, b) => b.uniquePlayers - a.uniquePlayers);
  }, [records]);

  const handleRoomClick = (roomId: string) => {
    Taro.navigateTo({
      url: `/pages/room-detail/index?roomId=${roomId}`
    });
  };

  const scareUniquePlayers = useMemo(() => {
    const players = new Set<string>();
    records
      .filter(r => r.tags.some(t => t.includes('scare')))
      .forEach(r => players.add(r.playerName || '匿名'));
    return players.size;
  }, [records]);

  return (
    <View className={styles.page}>
      <View className="page-container">
        <View className={styles.statsRow}>
          <StatCard
            title="试玩玩家"
            value={stats.uniquePlayers}
            subtitle="不同玩家数"
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
            title="总记录数"
            value={stats.totalRecords}
            subtitle="所有标注记录"
            color="#FFB020"
          />
          <StatCard
            title="被吓到的玩家"
            value={scareUniquePlayers}
            subtitle="至少1次惊吓"
            color="#FF2D55"
          />
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionDot} />
            <Text>问题类型分布（按玩家去重）</Text>
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
                    {item.uniquePlayers} 人 ({item.count}次)
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
                        <Text>{tag.name}·{tag.uniquePlayers}人</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View className={styles.problemCount}>
                  <Text className={styles.problemNumber}>{room.uniquePlayers}</Text>
                  <Text className={styles.problemLabel}>人遇到</Text>
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
