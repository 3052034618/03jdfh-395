import { Room } from '@/types';

export const mockRooms: Room[] = [
  {
    id: 'room-1',
    name: '入口大厅',
    description: '鬼屋入口，玩家第一个进入的房间',
    x: 50,
    y: 50,
    width: 120,
    height: 100,
    floor: 1,
    order: 1
  },
  {
    id: 'room-2',
    name: '废弃厨房',
    description: '充满锈迹的厨房，有诡异的音效',
    x: 200,
    y: 50,
    width: 100,
    height: 100,
    floor: 1,
    order: 2
  },
  {
    id: 'room-3',
    name: '幽暗走廊',
    description: '狭长的走廊，灯光闪烁',
    x: 330,
    y: 50,
    width: 80,
    height: 150,
    floor: 1,
    order: 3
  },
  {
    id: 'room-4',
    name: '儿童房',
    description: '诡异的儿童玩具房间',
    x: 50,
    y: 180,
    width: 100,
    height: 90,
    floor: 1,
    order: 4
  },
  {
    id: 'room-5',
    name: '血腥浴室',
    description: '有血迹的浴室，镜子女鬼',
    x: 180,
    y: 180,
    width: 90,
    height: 90,
    floor: 1,
    order: 5
  },
  {
    id: 'room-6',
    name: '祭坛密室',
    description: '最终BOSS房间，黑色仪式',
    x: 300,
    y: 230,
    width: 110,
    height: 100,
    floor: 1,
    order: 6
  },
  {
    id: 'room-7',
    name: '藏书阁楼',
    description: '二楼藏书室，幽灵游荡',
    x: 80,
    y: 300,
    width: 130,
    height: 80,
    floor: 2,
    order: 7
  },
  {
    id: 'room-8',
    name: '主人卧室',
    description: '古旧卧室，床底有惊喜',
    x: 250,
    y: 360,
    width: 120,
    height: 90,
    floor: 2,
    order: 8
  }
];

export const getRoomById = (id: string): Room | undefined => {
  return mockRooms.find(room => room.id === id);
};
