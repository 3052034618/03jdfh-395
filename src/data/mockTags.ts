import { Tag } from '@/types';

export const mockTags: Tag[] = [
  { id: 'tag-stay', name: '停留过久', type: 'stay', color: '#FFB020' },
  { id: 'tag-miss', name: '错过线索', type: 'miss', color: '#00F0FF' },
  { id: 'tag-scare-sound', name: '被音效吓退', type: 'scare', color: '#FF2D55' },
  { id: 'tag-scare-jump', name: '突脸惊吓', type: 'scare', color: '#FF2D55' },
  { id: 'tag-loop', name: '重复绕路', type: 'loop', color: '#7B2FFD' },
  { id: 'tag-confused', name: '看不懂符号', type: 'understand', color: '#20D080' },
  { id: 'tag-trigger-early', name: '提前触发', type: 'understand', color: '#20D080' },
  { id: 'tag-best-scare', name: '最佳惊吓', type: 'best', color: '#FFD700' },
  { id: 'tag-best-atmosphere', name: '氛围最佳', type: 'best', color: '#FFD700' },
  { id: 'tag-funny', name: '搞笑反应', type: 'best', color: '#FFD700' }
];

export const getTagById = (id: string): Tag | undefined => {
  return mockTags.find(tag => tag.id === id);
};

export const getTagsByType = (type: string): Tag[] => {
  return mockTags.filter(tag => tag.type === type);
};
