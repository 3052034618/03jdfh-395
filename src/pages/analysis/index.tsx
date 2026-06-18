import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useRecord } from '@/store/RecordContext';
import { mockTags, getTagById } from '@/data/mockTags';
import StatCard from '@/components/StatCard';
import { formatDuration } from '@/utils';

interface RoomStat {
  roomId: string;
  roomName: string;
  count: number;
  uniquePlayers: number;
  topTags: { id: string; name: string; color: string; count: number; uniquePlayers: number }[];
}

const AnalysisPage: React.FC = () => {
  const { records, rooms, sessions, currentSessionId } = useRecord();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const scopeLabel = selectedSessionId === null
    ? '全部场次'
    : (sessions.find(s => s.id === selectedSessionId)?.name || '场次');

  const scopedRecords = useMemo(() => {
    if (selectedSessionId === null) return records;
    return records.filter(r => r.sessionId === selectedSessionId);
  }, [records, selectedSessionId]);

  const stats = useMemo(() => {
    const totalRecords = scopedRecords.length;
    const roomsWithRecords = new Set(scopedRecords.map(r => r.roomId)).size;
    const avgPerRoom = roomsWithRecords > 0 ? (totalRecords / roomsWithRecords).toFixed(1) : '0';
    const uniquePlayers = new Set(scopedRecords.map(r => r.playerName).filter(Boolean)).size;
    const sessionCount = selectedSessionId === null
      ? new Set(scopedRecords.map(r => r.sessionId)).size
      : 1;

    return { totalRecords, roomsWithRecords, avgPerRoom, uniquePlayers, sessionCount };
  }, [scopedRecords, selectedSessionId]);

  const tagDistribution = useMemo(() => {
    const playerCounts: Record<string, Set<string>> = {};
    const occurrenceCounts: Record<string, number> = {};

    scopedRecords.forEach(record => {
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
  }, [scopedRecords]);

  const roomRank = useMemo(() => {
    const roomStats: Record<string, RoomStat> = {};
    const roomTagPlayers: Record<string, Record<string, Set<string>>> = {};
    const roomTagCounts: Record<string, Record<string, number>> = {};

    scopedRecords.forEach(record => {
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
      scopedRecords
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
  }, [scopedRecords]);

  const handleRoomClick = (roomId: string) => {
    Taro.navigateTo({
      url: `/pages/room-detail/index?roomId=${roomId}&sessionId=${selectedSessionId || ''}`
    });
  };

  const scareUniquePlayers = useMemo(() => {
    const players = new Set<string>();
    scopedRecords
      .filter(r => r.tags.some(t => t.includes('scare')))
      .forEach(r => players.add(r.playerName || '匿名'));
    return players.size;
  }, [scopedRecords]);

  return (
    <View className={styles.page}>
      <View className="page-container">
        <View className={styles.scopeBar}>
          <ScrollView scrollX className={styles.scopeScroll}>
            <View
              className={`${styles.scopeChip} ${selectedSessionId === null ? styles.scopeChipActive : ''}`}
              onClick={() => setSelectedSessionId(null)}
            >
              <Text className={styles.scopeChipText}>全部场次</Text>
              <Text className={styles.scopeChipCount}>{sessions.length}场</Text>
            </View>
            {sessions.map(s => {
              const count = records.filter(r => r.sessionId === s.id).length;
              const isActive = selectedSessionId === s.id;
              const isCurrent = s.id === currentSessionId;
              const dur = formatDuration(Math.floor(((s.endTime || Date.now()) - s.startTime) / 1000));
              return (
                <View
                  key={s.id}
                  className={`${styles.scopeChip} ${isActive ? styles.scopeChipActive : ''}`}
                  onClick={() => setSelectedSessionId(s.id)}
                >
                  <Text className={styles.scopeChipText}>
                    {s.name}{isCurrent ? '·当前' : ''}
                  </Text>
                  <Text className={styles.scopeChipCount}>{count}条·{dur}</Text>
                </View>
              );
            })}
          </ScrollView>
          <Text className={styles.scopeHint}>分析范围：{scopeLabel}</Text>
        </View>

        <View className={styles.statsRow}>
          <StatCard
            title={selectedSessionId === null ? '试玩场次' : '试玩时长'}
            value={selectedSessionId === null ? stats.sessionCount : stats.uniquePlayers}
            subtitle={selectedSessionId === null ? '参与统计' : `${stats.uniquePlayers}位玩家`}
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
            title="标注记录"
            value={stats.totalRecords}
            subtitle={`平均每房间 ${stats.avgPerRoom}`}
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
            {tagDistribution.length === 0 ? (
              <View style={{ padding: '40rpx 0', textAlign: 'center' }}>
                <Text style={{ color: '#606070', fontSize: '28rpx' }}>当前范围暂无标注记录</Text>
              </View>
            ) : tagDistribution.map(item => (
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
            {roomRank.length === 0 ? (
              <View style={{ padding: '80rpx 0', textAlign: 'center' }}>
                <Text style={{ color: '#606070', fontSize: '28rpx' }}>暂无卡点数据</Text>
              </View>
            ) : roomRank.map((room, index) => (
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
