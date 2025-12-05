<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# CPT Continuous Performance Test Prototype

---

# Readme（简体中文）

## 🚀 本地运行

**前置要求:** Node.js

1. 安装依赖：
   ```bash
   npm install
   ```

2. 在 [.env.local](.env.local) 中设置您的 Gemini API 密钥（当前版本为占位符，无需真实密钥）：
   ```bash
   # 复制 .env.example 为 .env.local
   # 当前版本无需真实 API 密钥，保持 GEMINI_API_KEY="" 即可
   ```

3. 运行应用：
   ```bash
   npm run dev
   ```

## 📋 项目说明

这是一个基于 React + TypeScript + Vite 构建的持续性操作测试 (CPT) 原型应用，用于注意力缺陷多动障碍 (ADHD) 的初步筛查评估。

### ✨ 核心功能
- 🎯 视觉和听觉刺激测试
- ⏱️ 反应时间精确测量
- 📊 实时数据分析和可视化
- 📈 基于常模的 T 分数计算
- 🔢 风险概率评估

### 🛠️ 技术栈
- **前端框架:** React 19
- **开发语言:** TypeScript
- **构建工具:** Vite
- **图表库:** Recharts
- **图标库:** Lucide React

## ⚙️ 配置说明

### 配置文件位置

为了确保项目在纯前端环境下的稳定性，目前的配置位于 **`constants.ts`** 文件中。您可以直接编辑该文件来调整测试参数。

*   **文件路径**: `/constants.ts`
*   **配置对象**: `APP_CONFIG`

您会在该文件中看到如下结构：

```typescript
export const APP_CONFIG: TestConfig = {
  phases: [
    // ... 阶段配置 ...
  ]
};
```

### 图片素材说明

为了方便原型部署，目前的图片素材（S图和V图）是**内置在代码中的**。

*   **位置**: `constants.ts` 文件顶部
*   **变量名**: `IMG_S` (S图标), `IMG_V` (V图标)

#### 如何替换为您自己的图片？

如果您希望使用本地图片（例如 `.jpg` 或 `.png`），请按以下步骤操作：

1. 将图片放入项目的 `assets/` 文件夹（如需创建）。
2. 打开 `constants.ts`。
3. 修改变量定义，将 SVG 代码替换为文件路径。

**示例：**

```typescript
// 修改前 (内置 SVG)
const IMG_S = `data:image/svg+xml...`;

// 修改后 (引用本地图片)
const IMG_S = './assets/my-image.png';
```

### 详细参数说明

#### 阶段配置参数 (PhaseConfig)

每个阶段对象包含以下字段：

##### A. 基础信息
| 参数名 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| `id` | String | 阶段的唯一标识符。 | `"PHASE_1_VISUAL"` |
| `type` | String | 阶段类型。`"TEST"` (测试) 或 `"REST"` (休息)。 | `"TEST"` |
| `duration` | Number | 阶段持续时间，单位**毫秒**。可以使用 `minToMs(7)` 辅助函数表示7分钟。 | `minToMs(7)` |

##### B. 流程控制 (仅 TEST 类型有效)
| 参数名 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| `hasCountdown` | Boolean | 是否在阶段开始前显示 "3-2-1" 倒计时。 | `true` |
| `initialDelay` | Number | 倒计时后等待多久开始第一个刺激 (毫秒)。 | `2000` |
| `minISI` | Number | **最小**刺激间隔时间 (毫秒)。 | `2000` |
| `maxISI` | Number | **最大**刺激间隔时间 (毫秒)。 | `5000` |
| `stimulusDuration`| Number | 刺激显示时长 (毫秒)。 | `100` |
| `targetProbability`| Number | 目标出现的概率 (0.0 - 1.0)。 | `0.2` |

##### C. 素材资源
| 参数名 | 类型 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| `assetType` | String | 素材类型：`"text"` (文字) 或 `"image"` (图片)。 | `"text"` |
| `targetAsset` | String | **目标内容**。可以是文字 "X" 或图片变量 `IMG_S`。 | `"X"` |
| `nonTargetAsset` | String | **非目标内容**。可以是文字 "O" 或图片变量 `IMG_V`。 | `"O"` |

### 示例：修改测试时长

如果您想将第一阶段的时长改为 **1分钟**，请在 `constants.ts` 中找到 `PHASE_1_VISUAL`，修改 `duration`：

```typescript
// 修改前
duration: minToMs(7), 

// 修改后
duration: minToMs(1),
```

## 🌐 部署指南

### Vercel 部署
1. 将代码推送到 GitHub 仓库
2. 连接 Vercel 到您的 GitHub 账户
3. 导入项目并自动部署
4. （可选）在 Vercel 环境变量中设置 `GEMINI_API_KEY`

### 环境变量
```env
# 用于 Gemini AI 功能（当前版本为占位符）
GEMINI_API_KEY=""
```

## 📝 开发说明

- 当前版本为纯前端实现，所有数据分析在浏览器端完成
- AI 解读功能为预留接口，尚未实现
- 测试数据仅在当前会话有效，刷新页面后数据将丢失

## 📞 支持

如有问题请查看配置文档或提交 Issue。

在 AI Studio 中查看您的应用：https://ai.studio/apps/drive/1-5F5yxQbvk6KAOeSP9mpEhFt5EgFU-rG

---

# Readme (English)

## 🚀 Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (placeholder for current version, no real key needed):
   ```bash
   # Copy .env.example to .env.local
   # Current version doesn't require real API key, keep GEMINI_API_KEY=""
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## 📋 Project Description

This is a Continuous Performance Test (CPT) prototype application built with React + TypeScript + Vite, designed for preliminary screening assessment of Attention Deficit Hyperactivity Disorder (ADHD).

### ✨ Core Features
- 🎯 Visual and auditory stimulus testing
- ⏱️ Precise reaction time measurement
- 📊 Real-time data analysis and visualization
- 📈 Norm-based T-score calculation
- 🔢 Risk probability assessment

### 🛠️ Tech Stack
- **Frontend Framework:** React 19
- **Development Language:** TypeScript
- **Build Tool:** Vite
- **Chart Library:** Recharts
- **Icon Library:** Lucide React

## ⚙️ Configuration Guide

### Configuration File Location

To ensure project stability in a pure frontend environment, all configurations are located in the **`constants.ts`** file. You can directly edit this file to adjust test parameters.

*   **File Path**: `/constants.ts`
*   **Configuration Object**: `APP_CONFIG`

You will find the following structure in this file:

```typescript
export const APP_CONFIG: TestConfig = {
  phases: [
    // ... phase configurations ...
  ]
};
```

### Image Assets Description

For convenient prototype deployment, the current image assets (S and V icons) are **embedded directly in the code**.

*   **Location**: Top of the `constants.ts` file
*   **Variable Names**: `IMG_S` (S icon), `IMG_V` (V icon)

#### How to Replace with Your Own Images?

If you wish to use local image files (e.g., `.jpg` or `.png`), follow these steps:

1. Place the images in the project's `assets/` folder (create if needed).
2. Open `constants.ts`.
3. Modify the variable definitions, replacing the SVG code with file paths.

**Example:**

```typescript
// Before (embedded SVG)
const IMG_S = `data:image/svg+xml...`;

// After (reference local image)
const IMG_S = './assets/my-image.png';
```

### Detailed Parameter Description

#### Phase Configuration Parameters (PhaseConfig)

Each phase object contains the following fields:

##### A. Basic Information
| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` | String | Unique identifier for the phase. | `"PHASE_1_VISUAL"` |
| `type` | String | Phase type. `"TEST"` (test) or `"REST"` (rest). | `"TEST"` |
| `duration` | Number | Phase duration in **milliseconds**. Use `minToMs(7)` helper function for 7 minutes. | `minToMs(7)` |

##### B. Process Control (TEST type only)
| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `hasCountdown` | Boolean | Whether to show "3-2-1" countdown before phase starts. | `true` |
| `initialDelay` | Number | Delay after countdown before first stimulus (milliseconds). | `2000` |
| `minISI` | Number | **Minimum** inter-stimulus interval (milliseconds). | `2000` |
| `maxISI` | Number | **Maximum** inter-stimulus interval (milliseconds). | `5000` |
| `stimulusDuration`| Number | Stimulus display duration (milliseconds). | `100` |
| `targetProbability`| Number | Probability of target appearance (0.0 - 1.0). | `0.2` |

##### C. Asset Resources
| Parameter | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `assetType` | String | Asset type: `"text"` (text) or `"image"` (image). | `"text"` |
| `targetAsset` | String | **Target content**. Can be text "X" or image variable `IMG_S`. | `"X"` |
| `nonTargetAsset` | String | **Non-target content**. Can be text "O" or image variable `IMG_V`. | `"O"` |

### Example: Modifying Test Duration

If you want to change the duration of the first phase to **1 minute**, find `PHASE_1_VISUAL` in `constants.ts` and modify the `duration`:

```typescript
// Before
duration: minToMs(7), 

// After
duration: minToMs(1),
```

## 🌐 Deployment Guide

### Vercel Deployment
1. Push code to GitHub repository
2. Connect Vercel to your GitHub account
3. Import project and deploy automatically
4. (Optional) Set `GEMINI_API_KEY` in Vercel environment variables

### Environment Variables
```env
# For Gemini AI functionality (currently placeholder)
GEMINI_API_KEY=""
```

## 📝 Development Notes

- Current version is pure frontend implementation, all data analysis is done in the browser
- AI interpretation functionality is reserved interface, not yet implemented
- Test data is only valid for current session, data will be lost after page refresh

## 📞 Support

For issues, please check the configuration guide or submit an Issue.

View your app in AI Studio: https://ai.studio/apps/drive/1-5F5yxQbvk6KAOeSP9mpEhFt5EgFU-rG

---

<div align="center">
<sub>Built with ❤️ using React, TypeScript, and Vite</sub>
</div>