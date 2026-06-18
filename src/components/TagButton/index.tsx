import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface TagButtonProps {
  name: string;
  color: string;
  selected?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const TagButton: React.FC<TagButtonProps> = ({
  name,
  color,
  selected = false,
  onClick,
  size = 'medium'
}) => {
  return (
    <View
      className={classnames(
        styles.tagButton,
        styles[size],
        selected && styles.selected
      )}
      style={{
        borderColor: selected ? color : 'transparent',
        backgroundColor: selected ? `${color}20` : undefined
      }}
      onClick={onClick}
    >
      <View
        className={styles.dot}
        style={{ backgroundColor: color }}
      />
      <Text className={styles.tagText} style={{ color: selected ? color : undefined }}>
        {name}
      </Text>
    </View>
  );
};

export default TagButton;
