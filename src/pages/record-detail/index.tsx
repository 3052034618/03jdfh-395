import React, { useMemo } from 'react';
import { View, Text, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useRecord } from '@/store/RecordContext';
import { getTagById } from '@/data/mockTags';
import { formatDateTime } from '@/utils';
import TagButton from '@/components/TagButton';

const RecordDetailPage: React.FC = () => {
  const router = useRouter();
  const recordId = router.params.id as string;
  const { records, deleteRecord } = useRecord();

  const record = useMemo(() => {
    return records.find(r => r.id === recordId);
  }, [records, recordId]);

  const tags = useMemo(() => {
    if (!record) return [];
    return record.tags
      .map(tagId => getTagById(tagId))
      .filter(Boolean);
  }, [record]);

  const handleDelete = () => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      confirmColor: '#FF2D55',
      success: (res) => {
        if (res.confirm && recordId) {
          deleteRecord(recordId);
          Taro.showToast({ title: '已删除', icon: 'success' });
          setTimeout(() => Taro.navigateBack(), 500);
          console.log('[RecordDetail] 删除记录:', recordId);
        }
      }
    });
  };

  if (!record) {
    return (
      <View className={styles.page}>
        <View className="page-container">
          <Text>记录不存在</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={styles.page}>
      <View className="page-container">
        <View className={styles.detailCard}>
          <View className={styles.roomHeader}>
            <Text className={styles.roomName}>{record.roomName}</Text>
            <Text className={styles.recordTime}>{formatDateTime(record.timestamp)}</Text>
          </View>

          {record.note && (
            <View style={{ marginBottom: '24rpx' }}>
              <Text className={styles.sectionLabel}>观察备注</Text>
              <Text className={styles.noteText}>{record.note}</Text>
            </View>
          )}

          <View>
            <Text className={styles.sectionLabel}>标签</Text>
            <View className={styles.tagList}>
              {tags.map(tag => tag && (
                <TagButton
                  key={tag.id}
                  name={tag.name}
                  color={tag.color}
                  selected
                />
              ))}
            </View>
          </View>
        </View>

        <View className={styles.detailCard}>
          <Text className={styles.sectionLabel}>记录信息</Text>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>玩家</Text>
            <Text className={styles.infoValue}>{record.playerName || '未知'}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>房间</Text>
            <Text className={styles.infoValue}>{record.roomName}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>记录时间</Text>
            <Text className={styles.infoValue}>{formatDateTime(record.timestamp)}</Text>
          </View>
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>标签数量</Text>
            <Text className={styles.infoValue}>{record.tags.length} 个</Text>
          </View>
        </View>

        <Button className={styles.deleteButton} onClick={handleDelete}>
          删除记录
        </Button>
      </View>
    </View>
  );
};

export default RecordDetailPage;
