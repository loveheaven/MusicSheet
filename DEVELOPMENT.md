# Development Guide

## 项目架构

### 前端 (React + TypeScript)
- **框架**: React 18 + TypeScript + Vite
- **音乐记谱**: VexFlow - 用于渲染五线谱
- **音频播放**: Tone.js - 用于音频合成和播放
- **UI组件**: Lucide React (图标)
- **样式**: CSS3 + 响应式设计

### 后端 (Rust + Tauri)
- **框架**: Tauri 2.0
- **文件系统**: tauri-plugin-fs
- **对话框**: tauri-plugin-dialog
- **Shell**: tauri-plugin-shell
- **LilyPond解析**: 自定义Rust解析器

## 核心功能

### 1. LilyPond文件解析
```rust
// 在 src-tauri/src/main.rs 中
#[tauri::command]
async fn parse_lilypond_file(file_path: String) -> Result<ParsedMusic, String>
```

支持的LilyPond语法：
- 音符名称 (c, d, e, f, g, a, b)
- 升降号 (is = 升号, es = 降号)
- 八度标记 (' = 高八度, , = 低八度)
- 时值 (1, 2, 4, 8, 16)
- 调号 (`\key c \major`)
- 拍号 (`\time 4/4`)
- 标题信息 (title, composer)

### 2. 音乐记谱显示
```typescript
// 在 src/components/MusicNotation.tsx 中
const convertLilyPondToVexFlow = (note: LilyPondNote): string
```

使用VexFlow库将解析的音符转换为可视化的五线谱。

### 3. 音频播放
```typescript
// 在 src/components/AudioPlayer.tsx 中
const convertLilyPondToTone = (note: LilyPondNote): string
```

使用Tone.js进行实时音频合成和播放，支持：
- 播放/暂停/停止控制
- 实时音符高亮
- 音量控制

## 开发环境设置

### 前置要求
1. **Node.js** (v16+)
2. **Rust** (最新稳定版)
3. **Tauri CLI**
```bash
npm install -g @tauri-apps/cli@next
```

### 平台特定要求

#### Android开发
1. **Android Studio**
2. **Android SDK & NDK**
3. **Java JDK 8+**

初始化Android平台：
```bash
tauri android init
```

#### iOS开发 (仅macOS)
1. **Xcode**
2. **iOS SDK**

初始化iOS平台：
```bash
tauri ios init
```

#### Windows开发
1. **Microsoft Visual Studio** (带C++构建工具)
2. **Windows SDK**

## 开发命令

### 开发模式
```bash
# 桌面开发
npm run tauri:dev

# Android开发
npm run tauri:android

# iOS开发 (仅macOS)
npm run tauri:ios
```

### 构建
```bash
# 桌面构建
npm run tauri:build

# Android构建
tauri android build

# iOS构建 (仅macOS)
tauri ios build
```

## 项目结构详解

```
MusicSheet/
├── src/                          # React前端源码
│   ├── components/               # React组件
│   │   ├── MusicNotation.tsx    # 五线谱显示组件
│   │   └── AudioPlayer.tsx      # 音频播放组件
│   ├── App.tsx                  # 主应用组件
│   ├── App.css                  # 应用样式
│   ├── styles.css               # 全局样式
│   └── main.tsx                 # 应用入口
├── src-tauri/                   # Tauri后端源码
│   ├── src/
│   │   ├── main.rs              # 主程序入口
│   │   └── lib.rs               # 库文件
│   ├── Cargo.toml               # Rust依赖配置
│   ├── tauri.conf.json          # Tauri配置
│   ├── build.rs                 # 构建脚本
│   ├── icons/                   # 应用图标
│   └── capabilities/            # 权限配置
├── examples/                    # 示例LilyPond文件
├── scripts/                     # 开发脚本
├── package.json                 # Node.js依赖
├── vite.config.ts              # Vite配置
├── tsconfig.json               # TypeScript配置
└── README.md                   # 项目说明
```

## 添加新功能

### 1. 添加新的LilyPond语法支持
1. 在 `src-tauri/src/main.rs` 中的 `parse_lilypond_content` 函数添加新的正则表达式
2. 更新 `ParsedMusic` 结构体
3. 在前端组件中处理新的数据

### 2. 添加新的音频效果
1. 在 `src/components/AudioPlayer.tsx` 中使用Tone.js API
2. 添加新的控制界面
3. 更新音频播放逻辑

### 3. 添加新的显示功能
1. 在 `src/components/MusicNotation.tsx` 中使用VexFlow API
2. 处理新的音乐元素
3. 更新渲染逻辑

## 调试技巧

### 前端调试
- 使用浏览器开发者工具
- React DevTools扩展
- Console.log输出

### 后端调试
```rust
// 在Rust代码中添加调试输出
println!("Debug: {:?}", variable);
```

### 移动端调试
```bash
# Android日志
adb logcat

# iOS日志 (Xcode Console)
```

## 性能优化

### 前端优化
1. **懒加载**: 大型LilyPond文件分页显示
2. **虚拟化**: 长列表使用虚拟滚动
3. **缓存**: 解析结果缓存

### 后端优化
1. **异步处理**: 文件解析使用异步操作
2. **内存管理**: 及时释放大型数据结构
3. **错误处理**: 完善的错误处理机制

## 测试

### 单元测试
```bash
# 前端测试
npm test

# 后端测试
cd src-tauri && cargo test
```

### 集成测试
1. 测试文件解析功能
2. 测试音频播放功能
3. 测试跨平台兼容性

## 发布流程

1. **版本更新**: 更新 `package.json` 和 `Cargo.toml` 中的版本号
2. **构建测试**: 在所有目标平台上测试构建
3. **打包发布**: 使用 `tauri build` 生成发布包
4. **签名**: 为移动端应用签名
5. **分发**: 上传到应用商店或发布平台

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request
5. 代码审查
6. 合并到主分支

## 常见问题

### Q: VexFlow渲染错误
A: 检查音符格式是否正确，确保八度和时值在有效范围内

### Q: 音频播放无声音
A: 检查浏览器音频权限，确保Tone.js正确初始化

### Q: 移动端构建失败
A: 检查平台特定的SDK和工具链是否正确安装

### Q: LilyPond文件解析失败
A: 检查文件编码和语法，当前支持基础LilyPond语法

## 相关资源

- [Tauri官方文档](https://tauri.app/)
- [VexFlow文档](https://vexflow.com/)
- [Tone.js文档](https://tonejs.github.io/)
- [LilyPond文档](https://lilypond.org/)
- [React文档](https://reactjs.org/)