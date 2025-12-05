
import { TestConfig } from './types';

// 占位图片（S 和 V 图标的 Data URI，用于模拟图片）
// S 代表信号/声音 (Signal/Sound) - 第3阶段的目标刺激
const IMG_S = './assets/X.mp3';

// V 代表视觉/空白 (Visual/Void) - 第3阶段的非目标刺激
const IMG_V = './assets/O.mp3';

export const KEY_CODE = 'Space';

// 辅助函数：将分钟转换为毫秒
const minToMs = (min: number) => min * 60 * 1000;

export const APP_CONFIG: TestConfig = {
  phases: [
    // 第1阶段：视觉测试 (X/O)
    {
      id: 'PHASE_1_VISUAL',
      type: 'TEST',
      duration: minToMs(1), // 7分钟
      hasCountdown: true,
      initialDelay: 2000, // 2秒固定启动延迟
      minISI: 2000, // 最小间隔 2000ms
      maxISI: 5000, // 最大间隔 5000ms
      stimulusDuration: 100, // 刺激呈现时长 (轻微视觉残留)
      targetProbability: 0.2,// 目标出现概率 (默认 20%)
      assetType: 'text',
      targetAsset: 'X',
      nonTargetAsset: 'O',
    },
    // 第2阶段：休息
    {
      id: 'PHASE_2_REST',
      type: 'REST',
      duration: 60000, // 60秒
    },
    // 第3阶段：听觉替代测试 (S/V 图片)
    {
      id: 'PHASE_3_AUDIO_PROXY',
      type: 'TEST',
      duration: minToMs(1), // 7分钟
      hasCountdown: true,
      initialDelay: 2000, // 2秒固定启动延迟
      minISI: 1000, // 最小间隔 1000ms
      maxISI: 8000, // 最大间隔 8000ms
      stimulusDuration: 2000, // S/V 图片停留时间稍长
      targetProbability: 0.2,
      assetType: 'audio',
      targetAsset: IMG_S, // 代表“声音”目标
      nonTargetAsset: IMG_V, // 代表“视觉/无效”非目标
    }
  ]
};

// 用于开发测试，取消注释此块可加速测试流程 (缩短时间)
/*
export const APP_CONFIG: TestConfig = {
  phases: [
    {
      id: 'PHASE_1_VISUAL',
      type: 'TEST',
      duration: 15000, // 15秒测试
      hasCountdown: true,
      initialDelay: 1000,
      minISI: 1000,
      maxISI: 2000,
      stimulusDuration: 100,
      targetProbability: 0.3,
      assetType: 'text',
      targetAsset: 'X',
      nonTargetAsset: 'O',
    },
    {
      id: 'PHASE_2_REST',
      type: 'REST',
      duration: 5000, // 5秒休息
    },
    {
      id: 'PHASE_3_AUDIO_PROXY',
      type: 'TEST',
      duration: 15000, // 15秒测试
      hasCountdown: true,
      initialDelay: 1000,
      minISI: 500,
      maxISI: 1500,
      stimulusDuration: 200,
      targetProbability: 0.3,
      assetType: 'image',
      targetAsset: IMG_S,
      nonTargetAsset: IMG_V,
    }
  ]
};
*/
