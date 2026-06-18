import React, { useState, useMemo } from 'react';
import { View, Text, Button, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useRecord } from '@/store/RecordContext';
import { getTagById } from '@/data/mockTags';
import { formatDateTime, copyToClipboard } from '@/utils';
import TagButton from '@/components/TagButton';
import { ExportTemplate, RecordItem } from '@/types';

type FilterType = 'all' | 'best' | 'scare' | 'understand' | 'miss' | 'funny';
type GroupByType = 'room' | 'player' | 'tag' | 'time';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'best', label: '最佳瞬间' },
  { key: 'scare', label: '惊吓反应' },
  { key: 'understand', label: '剧情断点' },
  { key: 'miss', label: '错过线索' },
  { key: 'funny', label: '搞笑反应' }
];

const GROUP_TABS: { key: GroupByType; label: string }[] = [
  { key: 'room', label: '按房间' },
  { key: 'player', label: '按玩家' },
  { key: 'tag', label: '按问题' },
  { key: 'time', label: '按时间' }
];

const getFilterLabel = (k: FilterType) => FILTERS.find(f => f.key === k)?.label || '全部';
const getGroupLabel = (k: GroupByType) => GROUP_TABS.find(g => g.key === k)?.label || '按房间';

const applyFilter = (records: RecordItem[], filter: FilterType): RecordItem[] => {
  if (filter === 'all') return records;
  const match = (t: string): boolean => {
    if (filter === 'best') return t.includes('best');
    if (filter === 'scare') return t.includes('scare');
    if (filter === 'understand') return t.includes('understand') || t.includes('confused') || t.includes('trigger');
    if (filter === 'miss') return t.includes('miss');
    if (filter === 'funny') return t.includes('funny');
    return false;
  };
  return records.filter(r => r.tags.some(match));
};

const groupRecords = (records: RecordItem[], groupBy: GroupByType): { key: string; label: string; items: RecordItem[] }[] => {
  const groups: Record<string, { label: string; items: RecordItem[] }> = {};

  records.forEach(record => {
    let key = '';
    let label = '';

    if (groupBy === 'room') {
      key = record.roomId;
      label = record.roomName;
    } else if (groupBy === 'player') {
      key = record.playerName || '匿名';
      label = record.playerName || '匿名玩家';
    } else if (groupBy === 'tag') {
      const firstTag = record.tags[0];
      const tag = firstTag ? getTagById(firstTag) : null;
      key = tag?.id || 'other';
      label = tag?.name || '其他';
    } else if (groupBy === 'time') {
      const d = new Date(record.timestamp);
      const dayKey = `${d.getMonth() + 1}-${d.getDate()}`;
      key = dayKey;
      label = `${dayKey} 记录`;
    }

    if (!groups[key]) {
      groups[key] = { label, items: [] };
    }
    groups[key].items.push(record);
  });

  return Object.entries(groups)
    .map(([key, val]) => ({ key, label: val.label, items: val.items }))
    .sort((a, b) => b.items.length - a.items.length);
};

const ExportPage: React.FC = () => {
  const { records, templates, saveTemplate, deleteTemplate } = useRecord();

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [groupBy, setGroupBy] = useState<GroupByType>('room');
  const [sheetVisible, setSheetVisible] = useState(false);
  const [tplName, setTplName] = useState('');

  const filteredRecords = useMemo(() => {
    const data = applyFilter(records, activeFilter);
    return data.sort((a, b) => b.timestamp - a.timestamp);
  }, [records, activeFilter]);

  const groupedData = useMemo(() => groupRecords(filteredRecords, groupBy), [filteredRecords, groupBy]);

  const applyTemplate = (tpl: ExportTemplate) => {
    setActiveFilter(tpl.filterType);
    setGroupBy(tpl.groupBy);
    Taro.showToast({ title: `已套用：${tpl.name}`, icon: 'none' });
  };

  const handleSaveTemplate = () => {
    const name = tplName.trim() || `${getFilterLabel(activeFilter)}·${getGroupLabel(groupBy)}`;
    saveTemplate({
      name,
      filterType: activeFilter,
      groupBy
    });
    setSheetVisible(false);
    setTplName('');
    Taro.showToast({ title: '模板已保存', icon: 'success' });
  };

  const handleDeleteTemplate = (tplId: string, tplName: string) => {
    Taro.showModal({
      title: '删除模板',
      content: `确认删除模板"${tplName}"？`,
      confirmColor: '#FF2D55',
      success: (res) => {
        if (res.confirm) {
          deleteTemplate(tplId);
          Taro.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  };

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' });
  };

  const generateExportText = (): string => {
    const filterLabel = getFilterLabel(activeFilter);
    const groupLabel = getGroupLabel(groupBy);
    let text = `【鬼屋试玩剪辑备注 - ${filterLabel} / ${groupLabel}】\n`;
    text += `导出时间：${formatDateTime(Date.now())}\n`;
    text += `共 ${filteredRecords.length} 条记录\n\n`;

    groupedData.forEach(group => {
      text += `━━━ ${group.label} (${group.items.length}条) ━━━\n`;
      const sortedItems = [...group.items].sort((a, b) => a.timestamp - b.timestamp);
      sortedItems.forEach(record => {
        const tagNames = record.tags
          .map(tid => getTagById(tid)?.name)
          .filter(Boolean)
          .join('、');
        text += `• [${formatDateTime(record.timestamp)}] ${record.roomName} / ${record.playerName || '匿名'}\n`;
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
    if (filteredRecords.length === 0) {
      Taro.showToast({ title: '暂无记录可复制', icon: 'none' });
      return;
    }
    const text = generateExportText();
    const success = await copyToClipboard(text);
    if (success) {
      Taro.showToast({ title: '已复制到剪贴板', icon: 'success', duration: 1500 });
      console.log('[ExportPage] 复制成功，共', filteredRecords.length, '条');
    } else {
      Taro.showToast({ title: '复制失败，请重试', icon: 'none', duration: 1500 });
      console.error('[ExportPage] 复制失败');
    }
  };

  return (
    <View className={styles.page}>
      <View className="page-container">
        <View className={styles.topBar}>
          <ScrollView scrollX className={styles.filterScroll}>
            {FILTERS.map(filter => (
              <View
                key={filter.key}
                className={`${styles.filterItem} ${activeFilter === filter.key ? styles.active : ''}`}
                onClick={() => setActiveFilter(filter.key)}
              >
                <Text className={styles.filterText}>{filter.label}</Text>
              </View>
            ))}
          </ScrollView>
          <View className={styles.groupRow}>
            <Text className={styles.groupLabel}>分组方式</Text>
            <View className={styles.groupTabs}>
              {GROUP_TABS.map(tab => (
                <Text
                  key={tab.key}
                  className={`${styles.groupTab} ${groupBy === tab.key ? styles.active : ''}`}
                  onClick={() => setGroupBy(tab.key)}
                >
                  {tab.label}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View className={styles.sectionTitle}>
          <Text>筛选结果</Text>
          <Text className={styles.countBadge}>{filteredRecords.length} 条记录</Text>
        </View>

        <View className={styles.templatesSection}>
          <View className={styles.sectionTitle}>
            <Text>常用模板</Text>
            <Text className={styles.saveTplBtn} onClick={() => setSheetVisible(true)}>
              ＋ 保存当前配置
            </Text>
          </View>
          {templates.length === 0 ? (
            <View style={{ padding: '24rpx 0', textAlign: 'center' }}>
              <Text style={{ fontSize: '26rpx', color: '#606070' }}>
                还没有模板，配置好筛选和分组后可保存为常用模板
              </Text>
            </View>
          ) : (
            <View className={styles.templateList}>
              {templates.map(tpl => (
                <View
                  key={tpl.id}
                  className={styles.templateCard}
                  onClick={() => applyTemplate(tpl)}
                >
                  <View
                    className={styles.templateDelete}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(tpl.id, tpl.name);
                    }}
                  >
                    <Text className={styles.templateDeleteText}>×</Text>
                  </View>
                  <Text className={styles.templateName}>{tpl.name}</Text>
                  <Text className={styles.templateMeta}>
                    {getFilterLabel(tpl.filterType)} / {getGroupLabel(tpl.groupBy)}
                  </Text>
                  <Text className={styles.templateUseBtn}>点击套用 →</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {filteredRecords.length === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无符合条件的记录</Text>
          </View>
        ) : (
          groupedData.map(group => (
            <View key={group.key} className={styles.groupSection}>
              <View className={styles.groupHeader}>
                <View className={styles.groupDot} />
                <Text className={styles.groupTitle}>{group.label}</Text>
                <Text className={styles.groupCount}>{group.items.length} 条</Text>
              </View>
              {group.items.map(record => (
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
                  <Text className={styles.recordPlayer}>{record.playerName || '匿名'}</Text>
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

      {sheetVisible && (
        <View className={styles.sheetOverlay} onClick={() => setSheetVisible(false)}>
          <View className={styles.sheetContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.sheetHeader}>
              <Text className={styles.sheetTitle}>保存为常用模板</Text>
              <View className={styles.sheetClose} onClick={() => setSheetVisible(false)}>
                <Text className={styles.sheetCloseText}>×</Text>
              </View>
            </View>

            <View className={styles.formRow}>
              <Text className={styles.formLabel}>模板名称</Text>
              <Input
                className={styles.formInput}
                placeholder={`${getFilterLabel(activeFilter)}·${getGroupLabel(groupBy)}`}
                value={tplName}
                onInput={(e) => setTplName(e.detail.value)}
              />
            </View>

            <View style={{
              padding: '16rpx 24rpx',
              background: 'rgba(123,47,253,0.1)',
              borderRadius: '12rpx',
              marginBottom: '24rpx'
            }}>
              <Text style={{ fontSize: '26rpx', color: '#A0A0B0', display: 'block' }}>当前配置预览</Text>
              <Text style={{ fontSize: '28rpx', color: '#F0F0F5', marginTop: '8rpx' }}>
                筛选：{getFilterLabel(activeFilter)} ｜ 分组：{getGroupLabel(groupBy)}
              </Text>
            </View>

            <Button className={styles.sheetPrimaryBtn} onClick={handleSaveTemplate}>
              保存模板
            </Button>
          </View>
        </View>
      )}
    </View>
  );
};

export default ExportPage;
