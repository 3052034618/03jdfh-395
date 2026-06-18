import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useRecord } from '@/store/RecordContext';
import { mockTags, getTagById } from '@/data/mockTags';
import { formatDateTime, copyToClipboard } from '@/utils';
import TagButton from '@/components/TagButton';

type FilterType = 'all' | 'best' | 'scare' | 'understand' | 'miss' | 'funny';

const ExportPage: React.FC = () => {
  const { records } = useRecord();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filters = [
    { key: 'all' as FilterType, label: '全部' },
    { key: 'best' as FilterType, label: '最佳瞬间' },
    { key: 'scare' as FilterType, label: '惊吓反应' },
    { key: 'understand' as FilterType, label: '剧情断点' },
    { key: 'miss' as FilterType, label: '错过线索' },
    { key: 'funny' as FilterType, label: '搞笑反应' }
  ];

  const filteredRecords = useMemo(() => {
    let result = [...records];

    if (activeFilter !== 'all') {
      if (activeFilter === 'best') {
        result = result.filter(r => r.tags.some(t => t.includes('best')));
      } else if (activeFilter === 'scare') {
        result = result.filter(r => r.tags.some(t => t.includes('scare')));
      } else if (activeFilter === 'understand') {
        result = result.filter(r => r.tags.some(t => t.includes('understand') || t.includes('confused') || t.includes('trigger')));
      } else if (activeFilter === 'miss') {
        result = result.filter(r => r.tags.some(t => t.includes('miss')));
      } else if (activeFilter === 'funny') {
        result = result.filter(r => r.tags.some(t => t.includes('funny')));
      }
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [records, activeFilter]);

  const groupedByRoom = useMemo(() => {
    const groups: Record<string, typeof filteredRecords> = {};
    filteredRecords.forEach(record => {
      if (!groups[record.roomName]) {
        groups[record.roomName] = [];
      }
      groups[record.roomName].push(record);
    });
    return groups;
  }, [filteredRecords]);

  const generateExportText = (): string => {
    const filterLabel = filters.find(f => f.key === activeFilter)?.label || '全部';
    let text = `【鬼屋试玩剪辑备注 - ${filterLabel}】\n`;
    text += `导出时间：${formatDateTime(Date.now())}\n`;
    text += `共 ${filteredRecords.length} 条记录\n\n`;

    Object.entries(groupedByRoom).forEach(([roomName, roomRecords]) => {
      text += `━━━ ${roomName} (${roomRecords.length}条) ━━━\n`;
      roomRecords.forEach(record => {
        const tagNames = record.tags
          .map(tid => getTagById(tid)?.name)
          .filter(Boolean)
          .join('、');
        text += `• [${formatDateTime(record.timestamp)}] ${record.playerName || ''}\n`;
        text += `  标签：${tagNames}\n`;
        if (record.note) {
          text += `  备注：${record.note}\n`;
        }
        text += '\n';
      });
    });

    return text;
  };

  const handleCopy = async () => {
    const text = generateExportText();
    const success = await copyToClipboard(text);
    if (success) {
      Taro.showToast({ title: '已复制到剪贴板', icon: 'success' });
      console.log('[ExportPage] 已复制导出文本');
    } else {
      Taro.showToast({ title: '复制失败', icon: 'none' });
    }
  };

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' });
  };

  return (
    <View className={styles.page}>
      <View className="page-container">
        <View className={styles.filterSection}>
          <ScrollView scrollX className={styles.filterScroll}>
            {filters.map(filter => (
              <View
                key={filter.key}
                className={`${styles.filterItem} ${activeFilter === filter.key ? styles.active : ''}`}
                onClick={() => setActiveFilter(filter.key)}
              >
                <Text className={styles.filterText}>{filter.label}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className={styles.sectionTitle}>
          <Text>筛选结果</Text>
          <Text className={styles.countBadge}>{filteredRecords.length} 条记录</Text>
        </View>

        {filteredRecords.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无符合条件的记录</Text>
          </View>
        ) : (
          Object.entries(groupedByRoom).map(([roomName, roomRecords]) => (
            <View key={roomName} className={styles.groupSection}>
              <View className={styles.groupHeader}>
                <View className={styles.groupDot} />
                <Text className={styles.groupTitle}>{roomName}</Text>
                <Text className={styles.groupCount}>{roomRecords.length} 条</Text>
              </View>
              {roomRecords.map(record => (
                <View key={record.id} className={styles.recordCard}>
                  <View className={styles.recordHeader}>
                    <Text className={styles.roomName}>{record.roomName}</Text>
                    <Text className={styles.recordTime}>{formatDateTime(record.timestamp)}</Text>
                  </View>
                  {record.note && (
                    <Text className={styles.recordNote}>{record.note}</Text>
                  )}
                  <View className={styles.tagList}>
                    {record.tags.map(tagId => {
                      const tag = getTagById(tagId);
                      return tag ? (
                        <TagButton
                          key={tagId}
                          name={tag.name}
                          color={tag.color}
                          size="small"
                          selected
                        />
                      ) : null;
                    })}
                  </View>
                  <Text className={styles.recordPlayer}>{record.playerName}</Text>
                </View>
              ))}
            </View>
          ))
        )}
      </View>

      <View className={styles.exportBar}>
        <Button className={styles.secondaryButton} onClick={handleShare}>
          分享
        </Button>
        <Button
          className={styles.exportButton}
          onClick={handleCopy}
          disabled={filteredRecords.length === 0}
        >
          复制全部 ({filteredRecords.length})
        </Button>
      </View>
    </View>
  );
};

export default ExportPage;
