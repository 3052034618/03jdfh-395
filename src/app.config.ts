export default defineAppConfig({
  pages: [
    'pages/record/index',
    'pages/analysis/index',
    'pages/export/index',
    'pages/room-detail/index',
    'pages/record-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1A1A1F',
    navigationBarTitleText: '鬼屋标注器',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0D0D0F'
  },
  tabBar: {
    color: '#606070',
    selectedColor: '#7B2FFD',
    backgroundColor: '#121217',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/record/index',
        text: '记录'
      },
      {
        pagePath: 'pages/analysis/index',
        text: '分析'
      },
      {
        pagePath: 'pages/export/index',
        text: '导出'
      }
    ]
  }
})
