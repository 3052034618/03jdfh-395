import { RecordItem, PlaySession } from '@/types';

const baseTime = Date.now() - 3600000 * 2;

export const mockRecords: RecordItem[] = [
  {
    id: 'rec-1',
    roomId: 'room-1',
    roomName: '入口大厅',
    tags: ['tag-stay'],
    note: '玩家在门口犹豫了30秒才敢进入',
    timestamp: baseTime + 60000,
    playerName: '玩家A'
  },
  {
    id: 'rec-2',
    roomId: 'room-1',
    roomName: '入口大厅',
    tags: ['tag-miss'],
    note: '没注意到墙上的血字提示',
    timestamp: baseTime + 120000,
    playerName: '玩家A'
  },
  {
    id: 'rec-3',
    roomId: 'room-2',
    roomName: '废弃厨房',
    tags: ['tag-scare-sound', 'tag-best-scare'],
    note: '水龙头突然滴水声把玩家吓得跳起来',
    timestamp: baseTime + 240000,
    playerName: '玩家A'
  },
  {
    id: 'rec-4',
    roomId: 'room-2',
    roomName: '废弃厨房',
    tags: ['tag-miss'],
    note: '没找到藏在冰箱里的钥匙',
    timestamp: baseTime + 360000,
    playerName: '玩家A'
  },
  {
    id: 'rec-5',
    roomId: 'room-3',
    roomName: '幽暗走廊',
    tags: ['tag-loop', 'tag-confused'],
    note: '来回走了三趟，没看懂墙上的符号顺序',
    timestamp: baseTime + 480000,
    playerName: '玩家A'
  },
  {
    id: 'rec-6',
    roomId: 'room-3',
    roomName: '幽暗走廊',
    tags: ['tag-scare-jump', 'tag-best-atmosphere'],
    note: '走廊尽头的人影突然消失，氛围拉满',
    timestamp: baseTime + 600000,
    playerName: '玩家A'
  },
  {
    id: 'rec-7',
    roomId: 'room-4',
    roomName: '儿童房',
    tags: ['tag-stay'],
    note: '玩家仔细看了每个玩具，停留时间较长',
    timestamp: baseTime + 720000,
    playerName: '玩家A'
  },
  {
    id: 'rec-8',
    roomId: 'room-5',
    roomName: '血腥浴室',
    tags: ['tag-scare-jump', 'tag-best-scare'],
    note: '镜子里的女鬼冲出来，玩家直接退到门口',
    timestamp: baseTime + 900000,
    playerName: '玩家A'
  },
  {
    id: 'rec-9',
    roomId: 'room-6',
    roomName: '祭坛密室',
    tags: ['tag-trigger-early'],
    note: '玩家没看完剧情就触发了最终追逐',
    timestamp: baseTime + 1080000,
    playerName: '玩家A'
  },
  {
    id: 'rec-10',
    roomId: 'room-2',
    roomName: '废弃厨房',
    tags: ['tag-stay', 'tag-confused'],
    note: '以为厨房门后有怪物所以不敢进入',
    timestamp: baseTime + 1200000,
    playerName: '玩家B'
  },
  {
    id: 'rec-11',
    roomId: 'room-3',
    roomName: '幽暗走廊',
    tags: ['tag-loop'],
    note: '迷路了，来回走了四次',
    timestamp: baseTime + 1320000,
    playerName: '玩家B'
  },
  {
    id: 'rec-12',
    roomId: 'room-7',
    roomName: '藏书阁楼',
    tags: ['tag-miss', 'tag-confused'],
    note: '书架上的密码本完全没看懂',
    timestamp: baseTime + 1500000,
    playerName: '玩家B'
  },
  {
    id: 'rec-13',
    roomId: 'room-8',
    roomName: '主人卧室',
    tags: ['tag-scare-sound', 'tag-funny'],
    note: '床底的手抓住脚踝，玩家尖叫着跳到床上',
    timestamp: baseTime + 1680000,
    playerName: '玩家B'
  }
];

export const mockSessions: PlaySession[] = [
  {
    id: 'session-1',
    playerName: '玩家A',
    startTime: baseTime,
    endTime: baseTime + 1200000,
    records: mockRecords.filter(r => r.playerName === '玩家A')
  },
  {
    id: 'session-2',
    playerName: '玩家B',
    startTime: baseTime + 1100000,
    endTime: baseTime + 1800000,
    records: mockRecords.filter(r => r.playerName === '玩家B')
  }
];
