import { useState, useCallback } from 'react';
import { RefreshControl } from 'react-native';

interface UsePullToRefreshProps {
  onRefresh: () => Promise<void>;
  refreshing?: boolean;
}

export const usePullToRefresh = ({ onRefresh, refreshing = false }: UsePullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(refreshing);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
      tintColor="#01C38D"
      colors={['#01C38D']}
      progressBackgroundColor="#191E29"
    />
  );

  return {
    refreshControl,
    isRefreshing,
    handleRefresh,
  };
};
