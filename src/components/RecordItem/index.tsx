import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import { RecordItem as RecordItemType } from '@/types';
import { getTagById } from '@/data/mockTags';
import { formatTime } from '@/utils';
import TagButton from '@/components/TagButton';

interface RecordItemProps {
  record: RecordItemType;
  onClick?: () => void;
  showTime?: boolean;
}

const RecordItemComponent: React.FC<RecordItemProps> = ({
  record,
  onClick,
  showTime = true
}) => {
  const tags = record.tags
    .map(tagId => getTagById(tagId))
    .filter(Boolean);

  return (
    <View className={styles.recordItem} onClick={onClick}>
      <View className={styles.recordHeader}>
        <Text className={styles.roomName}>{record.roomName}</Text>
        {showTime && (
          <Text className={styles.time}>{formatTime(record.timestamp)}</Text>
        )}
      </View>
      {record.note && (
        <Text className={styles.note}>{record.note}</Text>
      )}
      <View className={styles.tagList}>
        {tags.map(tag => tag && (
          <TagButton
            key={tag.id}
            name={tag.name}
            color={tag.color}
            size="small"
            selected
          />
        ))}
      </View>
      {record.playerName && (
        <Text className={styles.player}>{record.playerName}</Text>
      )}
    </View>
  );
};

export default RecordItemComponent;
