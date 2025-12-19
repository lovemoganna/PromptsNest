
import { PromptEntry, OutputType, ApplicationScene, Collection } from './types';

export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'col-1',
    name: '故事创作系列',
    description: '与叙事生成相关的提示词',
    createdAt: Date.now()
  },
  {
    id: 'col-2',
    name: '赛博朋克美学',
    description: '霓虹灯、高科技、低生活的视觉效果',
    createdAt: Date.now()
  },
  {
    id: 'col-3',
    name: '音频与代码',
    description: '音效和编程助手',
    createdAt: Date.now()
  }
];

export const INITIAL_PROMPTS: PromptEntry[] = [
  {
    id: 'seed-1',
    title: '毛绒朋友度假场景',
    promptEn: 'Input {{count}} images of different plush creatures. Create a funny {{parts}}-part story with these {{count}} fluffy friends going on a tropical vacation. The story is thrilling throughout with emotional highs and lows and ends in a happy moment. Keep the attire and identity consistent for all {{count}} characters.',
    promptCn: '输入{{count}}张不同毛绒生物的图片。用这{{count}}个毛茸茸的朋友去热带度假创作一个有趣的{{parts}}部分故事。故事全程惊险刺激，情绪跌宕起伏，最后以幸福时刻结尾。保持所有{{count}}个角色的服装和身份一致。',
    outputType: OutputType.IMAGE,
    sceneTag: ApplicationScene.STORY,
    techTags: ['一致性', '多图生成'],
    styleTags: ['卡通', '可爱', '3D渲染'],
    customTags: ['度假', '动物'],
    previewUrl: 'https://picsum.photos/400/300',
    source: '社区精选',
    model: 'Midjourney v6',
    usageNote: '确保输入图片清晰。配合 Niji 风格效果最佳。',
    precautions: '如果角色复杂度过高，可能会失去一致性。',
    variables: [
      { key: 'count', label: '图片数量', defaultValue: '3' },
      { key: 'parts', label: '故事部分', defaultValue: '10' }
    ],
    rating: { stability: 8, creativity: 9 },
    collectionId: 'col-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'seed-2',
    title: '赛博朋克城市飞越',
    promptEn: 'Cinematic drone shot flying through a neon-lit futuristic Tokyo at night, rain reflecting on the pavement, towering holograms, volumetric fog, high contrast, 8k resolution, photorealistic.',
    promptCn: '电影级无人机镜头，飞越夜晚霓虹闪烁的未来东京，雨水倒映在路面上，高耸的全息图，体积雾，高对比度，8k分辨率，照片级真实感。',
    outputType: OutputType.VIDEO,
    sceneTag: ApplicationScene.SCENE,
    techTags: ['运镜', '氛围感'],
    styleTags: ['赛博朋克', '写实', '黑色电影'],
    customTags: ['城市', '夜晚'],
    previewUrl: 'https://picsum.photos/400/225',
    model: 'Sora / Runway Gen-2',
    rating: { stability: 9, creativity: 7 },
    collectionId: 'col-2',
    createdAt: Date.now() - 100000,
    updatedAt: Date.now() - 100000,
  },
  {
    id: 'seed-3',
    title: 'Lo-Fi 学习节拍生成',
    promptEn: 'A chill, low-fidelity hip hop beat suitable for studying. Tempo 80 BPM. Soft piano melody with vinyl crackle noise, muted jazz drums, and a deep, steady bassline. Melancholic but relaxing atmosphere. Duration 3 minutes.',
    promptCn: '适合学习的低保真嘻哈节拍。速度80 BPM。柔和的钢琴旋律，伴有黑胶唱片的爆裂声，柔和的爵士鼓和深沉稳定的贝斯线。忧郁但轻松的氛围。时长3分钟。',
    outputType: OutputType.AUDIO,
    sceneTag: ApplicationScene.OTHER,
    techTags: ['音乐生成', '氛围感'],
    styleTags: ['Lo-Fi', '爵士', 'Chill'],
    customTags: ['学习', '音乐'],
    previewUrl: 'https://picsum.photos/400/200',
    model: 'Suno AI / Udio',
    rating: { stability: 10, creativity: 6 },
    collectionId: 'col-3',
    createdAt: Date.now() - 200000,
    updatedAt: Date.now() - 200000,
  },
  {
    id: 'seed-4',
    title: 'React 组件专家',
    promptEn: 'Act as a Senior React Engineer. Write a {{componentName}} component using TypeScript and Tailwind CSS. The component should handle {{props}} and include proper error boundaries and accessibility attributes (ARIA).',
    promptCn: '担任高级React工程师。使用TypeScript和Tailwind CSS编写一个{{componentName}}组件。该组件应处理{{props}}，并包括适当的错误边界和无障碍属性（ARIA）。',
    outputType: OutputType.TEXT,
    sceneTag: ApplicationScene.TOOL,
    techTags: ['代码', '角色扮演'],
    styleTags: ['专业', '整洁代码'],
    customTags: ['Web开发', 'React'],
    previewUrl: '',
    model: 'Gemini 2.0 Flash / Claude 3.5',
    variables: [
      { key: 'componentName', label: '组件名称', defaultValue: 'Modal' },
      { key: 'props', label: '属性 Props', defaultValue: 'isOpen, onClose' }
    ],
    rating: { stability: 10, creativity: 4 },
    collectionId: 'col-3',
    createdAt: Date.now() - 300000,
    updatedAt: Date.now() - 300000,
  }
];

export const COLOR_PALETTE = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

// Available tags for autocomplete suggestions
export const SUGGESTED_TECH_TAGS = [
  '一致性', '多图生成', '参考图', '负向提示词',
  '镜头控制', '循环', '思维链', '少样本'
];

export const SUGGESTED_STYLE_TAGS = [
  '写实', '卡通', '动漫', '油画', '赛博朋克',
  '极简主义', '吉卜力', '像素艺术', '电影级'
];

export const PROMPT_RECIPES = [
  {
    id: 'rec-1',
    title: 'MJ 超写实人像',
    promptEn: 'Hyper-realistic portrait of a {{subject}}, 8k resolution, cinematic lighting, shot on 35mm lens, sharp focus, detailed skin texture, soft bokeh background.',
    outputType: OutputType.IMAGE,
    sceneTag: ApplicationScene.CHARACTER,
    styleTags: ['写实', '电影级'],
    techTags: ['镜头控制']
  },
  {
    id: 'rec-2',
    title: 'SD 建筑设计',
    promptEn: 'Modern architectural design of a {{buildingType}} in {{environment}}, parametric facade, glass and concrete, sustainable design, dusk lighting, architectural photography style.',
    outputType: OutputType.IMAGE,
    sceneTag: ApplicationScene.SCENE,
    styleTags: ['写实', '极简主义'],
    techTags: ['环境光效']
  },
  {
    id: 'rec-3',
    title: 'GPT 角色扮演助手',
    promptEn: 'Act as a {{role}}. Your goal is to {{goal}}. Use a {{tone}} tone and provide structured responses. Always consider {{constraints}}.',
    outputType: OutputType.TEXT,
    sceneTag: ApplicationScene.TOOL,
    styleTags: ['专业'],
    techTags: ['角色分配']
  }
];
