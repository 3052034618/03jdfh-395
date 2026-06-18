import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  color = '#7B2FFD',
  trend
}) => {
  return (
    <View className={styles.statCard} style={{ borderLeftColor: color }}>
      <Text className={styles.title}>{title}</Text>
      <View className={styles.valueRow}>
        <Text className={styles.value} style={{ color }}>{value}</Text>
        {trend && (
          <View className={styles.trend}>
            <Text
              className={styles.trendText}
              style={{
                color: trend === 'up' ? '#FF2D55' : trend === 'down' ? '#20D080' : '#FFB020'
              }}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </Text>
          </View>
        )}
      </View>
      {subtitle && (
        <Text className={styles.subtitle}>{subtitle}</Text>
      )}
    </View>
  );
};

export default StatCard;
