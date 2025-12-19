
export enum OutputType {
  IMAGE = '图像',
  VIDEO = '视频',
  AUDIO = '音频',
  TEXT = '文本'
}

export enum ApplicationScene {
  CHARACTER = '角色设计',
  SCENE = '场景生成',
  STYLE_TRANSFER = '风格转换',
  STORY = '故事创作',
  TOOL = '工具使用',
  OTHER = '其他'
}

export interface PromptVariable {
  key: string;
  label: string;
  defaultValue?: string;
}

export interface PromptRating {
  stability: number; // 1-10
  creativity: number; // 1-10
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
}

export interface PromptVersion {
  id: string;
  timestamp: number;
  title: string;
  promptEn: string;
  promptCn: string;
  changeNote?: string;
}

export interface PromptEntry {
  id: string;
  title: string;
  promptEn: string;
  promptCn: string;
  outputType: OutputType;
  sceneTag: ApplicationScene | string; // Level 1
  techTags: string[]; // Level 2
  styleTags: string[]; // Level 3
  customTags: string[];
  previewUrl?: string;
  source?: string;
  model?: string;
  usageNote?: string;
  precautions?: string;

  // Phase 1: Data Refinement
  variables?: PromptVariable[];
  rating?: PromptRating;
  collectionId?: string;

  // Phase 10: History
  history?: PromptVersion[];

  // Usage Statistics
  copyCount?: number;
  viewCount?: number;

  createdAt: number;
  updatedAt: number;
}

export interface FilterState {
  searchTerm: string;
  outputType: OutputType | 'All';
  selectedTags: string[];
  collectionId: string | 'All';
  model: string | 'All';
}

export type SortOption = 'newest' | 'oldest' | 'updated' | 'rating';
