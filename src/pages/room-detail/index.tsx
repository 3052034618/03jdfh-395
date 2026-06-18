import React, { useMemo } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useRecord } from '@/store/RecordContext';
import { getRoomById } from '@/data/mockRooms';
import { mockTags, getTagById } from '@/data/mockTags';
import RecordItemComponent from '@/components/RecordItem';

const RoomDetailPage: React.FC = () => {
  const router = useRouter();
  const roomId = router.params.roomId as string;
  const { getRecordsByRoom } = useRecord();

  const room = useMemo(() => getRoomById(roomId), [roomId]);
  const records = useMemo(() => getRecordsByRoom(roomId), [getRecordsByRoom, roomId]);

  const uniquePlayers = useMemo(() => {
    const players = new Set<string>();
    records.forEach(r => players.add(r.playerName || '匿名'));
    return players.size;
  }, [records]);

  const tagStats = useMemo(() => {
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

    const maxUnique = Math.max(
      ...Object.values(playerCounts).map(s => s.size),
      1
    );

    return mockTags
      .filter(tag => occurrenceCounts[tag.id])
      .map(tag => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        count: occurrenceCounts[tag.id] || 0,
        uniquePlayers: playerCounts[tag.id]?.size || 0,
        percentage: Math.round((playerCounts[tag.id]?.size || 0) / maxUnique * 100)
      }))
      .sort((a, b) => b.uniquePlayers - a.uniquePlayers);
  }, [records]);

  const generateInsight = (): string => {
    if (records.length === 0) return '暂无数据';

    const topTag = tagStats[0];
    if (!topTag) return '暂无数据';

    const hasScare = tagStats.some(t => t.id.includes('scare'));
    const hasConfused = tagStats.some(t => t.id.includes('confused') || t.id.includes('understand'));
    const hasMiss = tagStats.some(t => t.id.includes('miss'));
    const hasLoop = tagStats.some(t => t.id.includes('loop'));

    let insight = '';

    if (hasConfused && hasMiss) {
      const confusedPlayers = tagStats.find(t => t.id.includes('confused') || t.id.includes('understand'))?.uniquePlayers || 0;
      insight = `该房间存在较明显的理解障碍，有 ${confusedPlayers} 位玩家看不懂符号提示或错过线索。建议：1）增加符号的视觉引导；2）在线索附近增加环境暗示。`;
    } else if (hasLoop) {
      const loopPlayers = tagStats.find(t => t.id.includes('loop'))?.uniquePlayers || 0;
      insight = `有 ${loopPlayers} 位玩家在该房间迷路绕圈。可能是空间布局导向性不足，或关键路径标识不够明显。建议优化动线设计，增加方向指引。`;
    } else if (hasScare) {
      const scarePlayers = tagStats.filter(t => t.id.includes('scare')).reduce((sum, t) => sum + t.uniquePlayers, 0);
      insight = `该房间惊吓效果出色，有 ${scarePlayers} 位玩家产生惊吓反应。${topTag.id.includes('best') ? '被评为最佳惊吓点，可作为宣发重点素材。' : '可考虑进一步强化惊吓节奏。'}`;
    } else if (hasMiss) {
      const missPlayers = tagStats.find(t => t.id.includes('miss'))?.uniquePlayers || 0;
      insight = `有 ${missPlayers} 位玩家错过了该房间的线索。建议将线索放置在更显眼的位置，或增加音效/光线引导玩家注意。`;
    } else {
      insight = `该房间最突出的问题是"${topTag.name}"，有 ${topTag.uniquePlayers} 位玩家遇到（共 ${topTag.count} 次）。建议针对性优化设计。`;
    }

    return insight;
  };

  if (!room) {
    return (
      <View className={styles.page}>
        <View className="page-container">
          <Text>房间不存在</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className="page-container">
        <View className={styles.roomHeader}>
          <Text className={styles.roomName}>{room.name}</Text>
          <Text className={styles.roomDesc}>{room.description}</Text>
          <View className={styles.roomMeta}>
            <View className={styles.metaItem}>
              <Text className={styles.metaValue}>{uniquePlayers}</Text>
              <Text className={styles.metaLabel}>位玩家</Text>
            </View>
            <View className={styles.metaItem}>
              <Text className={styles.metaValue}>{records.length}</Text>
              <Text className={styles.metaLabel}>总记录</Text>
            </View>
            <View className={styles.metaItem}>
              <Text className={styles.metaValue}>{tagStats.length}</Text>
              <Text className={styles.metaLabel}>问题类型</Text>
            </View>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionDot} />
            <Text>问题分布（按玩家去重）</Text>
          </View>
          <View className={styles.tagStats}>
            {tagStats.map(tag => (
              <View key={tag.id} className={styles.tagStatItem}>
                <View className={styles.tagInfo}>
                  <View className={styles.tagDot} style={{ backgroundColor: tag.color }} />
                  <Text className={styles.tagName}>{tag.name}</Text>
                </View>
                <View className={styles.tagBarWrap}>
                  <View className={styles.tagBarBg}>
                    <View
                      className={styles.tagBarFill}
                      style={{
                        width: `${tag.percentage}%`,
                        backgroundColor: tag.color
                      }}
                    />
                  </View>
                </View>
                <View className={styles.tagCount}>
                  <Text className={styles.tagCountNum}>{tag.uniquePlayers}</Text>
                  <Text className={styles.tagCountUnit}>人({tag.count}次)</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionDot} />
            <Text>AI 分析建议</Text>
          </View>
          <View className={styles.insightCard}>
            <Text className={styles.insightTitle}>设计洞察</Text>
            <Text className={styles.insightText}>{generateInsight()}</Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionTitle}>
            <View className={styles.sectionDot} />
            <Text>记录明细</Text>
          </View>
          <View className={styles.recordList}>
            {records.map(record => (
              <RecordItemComponent
                key={record.id}
                record={record}
                onClick={() => Taro.navigateTo({ url: `/pages/record-detail/index?id=${record.id}` })}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

export default RoomDetailPage;
