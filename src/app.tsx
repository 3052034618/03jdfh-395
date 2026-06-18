import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { RecordProvider } from '@/store/RecordContext';
import './app.scss';

function App(props) {
  useEffect(() => {});

  useDidShow(() => {});

  useDidHide(() => {});

  return (
    <RecordProvider>
      {props.children}
    </RecordProvider>
  );
}

export default App;
