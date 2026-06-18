import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import { Room } from '@/types';

interface RoomCardProps {
  room: Room;
  recordCount?: number;
  selected?: boolean;
  onClick?: () => void;
}

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  recordCount = 0,
  selected = false,
  onClick
}) => {
  return (
    <View
      className={classnames(styles.roomCard, selected && styles.selected)}
      onClick={onClick}
    >
      <View className={styles.roomHeader}>
        <Text className={styles.roomName}>{room.name}</Text>
        {recordCount > 0 && (
          <View className={styles.badge}>
            <Text className={styles.badgeText}>{recordCount}</Text>
          </View>
        )}
      </View>
      <Text className={styles.roomDesc}>{room.description}</Text>
      <View className={styles.roomFloor}>
        <Text className={styles.floorText}>{room.floor}F</Text>
        <Text className={styles.orderText}>#{room.order}</Text>
      </View>
    </View>
  );
};

export default RoomCard;
