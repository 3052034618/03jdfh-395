import Taro from '@tarojs/taro';

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const formatDateTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins > 0) {
    return `${mins}分${secs}秒`;
  }
  return `${secs}秒`;
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    console.log('[Utils] 准备复制到剪贴板，内容长度:', text.length);

    if (process.env.TARO_ENV === 'h5') {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          console.log('[Utils] H5 navigator.clipboard 复制成功');
          return true;
        }
      } catch (e) {
        console.warn('[Utils] navigator.clipboard 失败，降级到 textarea:', e);
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (success) {
          console.log('[Utils] H5 execCommand 复制成功');
          return true;
        } else {
          console.error('[Utils] H5 execCommand 返回失败');
          return false;
        }
      } catch (err) {
        document.body.removeChild(textarea);
        console.error('[Utils] H5 execCommand 异常:', err);
        return false;
      }
    }

    try {
      await Taro.setClipboardData({ data: text });
      console.log('[Utils] Taro.setClipboardData 复制成功');
      return true;
    } catch (taroErr) {
      console.error('[Utils] Taro.setClipboardData 失败:', taroErr);
      return false;
    }
  } catch (error) {
    console.error('[Utils] 复制到剪贴板完全失败:', error);
    return false;
  }
};
