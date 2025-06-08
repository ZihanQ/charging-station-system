<div align="center">

# 🚗⚡ 智能充电桩调度计费系统

**基于 React + Node.js 的现代化充电桩管理平台**

[![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=for-the-badge&logo=mysql)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

[📚 快速开始](#-快速开始) • [🎯 功能特性](#-功能特性) • [🛠️ 技术栈](#️-技术栈) • [📖 API文档](#-api文档) • [🤝 贡献指南](#-贡献指南)

</div>

---

## 📋 项目简介

智能充电桩调度计费系统是一个现代化的电动车充电管理平台，采用前后端分离架构设计。系统实现了智能调度算法、动态计费策略、实时监控和多角色权限管理，为电动车充电站提供完整的解决方案。

### ✨ 核心亮点

- 🧠 **智能调度算法** - 基于最短完成时间原则的动态调度
- 💰 **灵活计费系统** - 支持峰平谷电价和多种费率模式
- 🔄 **实时数据同步** - WebSocket 实现的实时状态更新
- 👥 **多角色管理** - 用户端和管理端分离设计
- 📊 **数据可视化** - 丰富的图表和报表功能
- 🛡️ **安全可靠** - JWT认证 + 权限控制

## 🎯 功能特性

### 🚀 用户端功能

- **用户管理**
  - ✅ 用户注册/登录
  - ✅ 个人信息管理
  - ✅ 密码修改和找回

- **充电服务**
  - ✅ 充电申请提交
  - ✅ 排队状态实时查看
  - ✅ 充电进度监控
  - ✅ 充电历史记录

- **费用管理**
  - ✅ 实时费用计算
  - ✅ 充电详单查看
  - ✅ 费用统计分析

### 🎛️ 管理端功能

- **充电桩管理**
  - ✅ 充电桩状态监控
  - ✅ 设备启停控制
  - ✅ 故障处理和维护

- **调度管理**
  - ✅ 智能调度策略配置
  - ✅ 队列管理和优化
  - ✅ 紧急调度处理

- **数据分析**
  - ✅ 实时数据监控
  - ✅ 使用统计报表
  - ✅ 收益分析图表

### 🔧 系统特性

- **实时通信** - Socket.io 实现的双向数据同步
- **响应式设计** - 支持桌面端和移动端访问
- **多语言支持** - 国际化 i18n 框架
- **主题切换** - 支持亮色/暗色主题
- **离线缓存** - PWA 技术支持离线使用

## 🛠️ 技术栈

### 前端技术

| 技术 | 版本 | 描述 |
|------|------|------|
| ![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react) | 19.1.0 | 用户界面框架 |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript) | 5.8 | 类型安全的JavaScript |
| ![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=flat-square&logo=vite) | 6.3.5 | 构建工具和开发服务器 |
| ![Ant Design](https://img.shields.io/badge/Ant%20Design-5.25.4-0170FE?style=flat-square&logo=antdesign) | 5.25.4 | 企业级UI设计语言 |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-06B6D4?style=flat-square&logo=tailwindcss) | 3.4.17 | 原子化CSS框架 |
| ![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?style=flat-square&logo=socketdotio) | 4.8.1 | 实时通信客户端 |

### 后端技术

| 技术 | 版本 | 描述 |
|------|------|------|
| ![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs) | 18+ | JavaScript运行时环境 |
| ![Express](https://img.shields.io/badge/Express-4.19.2-000000?style=flat-square&logo=express) | 4.19.2 | Web应用程序框架 |
| ![Prisma](https://img.shields.io/badge/Prisma-6.9.0-2D3748?style=flat-square&logo=prisma) | 6.9.0 | 现代数据库ORM |
| ![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?style=flat-square&logo=mysql) | 8.0 | 关系型数据库 |
| ![Socket.io](https://img.shields.io/badge/Socket.io-4.8.1-010101?style=flat-square&logo=socketdotio) | 4.8.1 | 实时通信服务端 |
| ![JWT](https://img.shields.io/badge/JWT-9.0.2-000000?style=flat-square&logo=jsonwebtokens) | 9.0.2 | 身份认证令牌 |

### 开发工具

- **代码质量**: ESLint + TypeScript 严格模式
- **包管理**: npm
- **版本控制**: Git
- **数据库管理**: Prisma Studio
- **API测试**: 内置健康检查端点

## 📦 项目结构

```
charging-station-system/
├── 📁 frontend/                 # 前端项目
│   ├── 📁 src/
│   │   ├── 📁 components/       # 可复用组件
│   │   ├── 📁 pages/           # 页面组件
│   │   ├── 📁 services/        # API服务
│   │   ├── 📁 hooks/           # 自定义Hooks
│   │   ├── 📁 utils/           # 工具函数
│   │   ├── 📁 types/           # TypeScript类型定义
│   │   └── 📁 assets/          # 静态资源
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   └── 📄 tailwind.config.js
├── 📁 backend/                  # 后端项目
│   ├── 📁 src/
│   │   ├── 📁 routes/          # 路由控制器
│   │   ├── 📁 services/        # 业务逻辑服务
│   │   ├── 📁 middleware/      # 中间件
│   │   ├── 📁 utils/           # 工具函数
│   │   └── 📄 index.ts         # 应用入口
│   ├── 📁 prisma/
│   │   ├── 📄 schema.prisma    # 数据库模型
│   │   └── 📄 seed.ts          # 种子数据
│   ├── 📄 package.json
│   └── 📄 tsconfig.json
├── 📄 start.md                 # 详细启动指南
├── 📄 QUICK_START.md           # 快速启动指南
├── 🚀 start-dev.bat           # Windows启动脚本
├── 🚀 start-dev.sh            # Linux/Mac启动脚本
└── 📄 README.md               # 项目说明文档
```

## 🚀 快速开始

### 📋 环境要求

确保您的开发环境满足以下要求：

- **Node.js**: >= 18.0.0
- **MySQL**: >= 8.0
- **Git**: 最新版本
- **npm**: >= 8.0.0

### ⚡ 一键启动

```bash
# 克隆项目
git clone https://github.com/ZihanQ/charging-station-system.git
cd charging-station-system

# Windows 用户
start-dev.bat

# Mac/Linux 用户
chmod +x start-dev.sh && ./start-dev.sh
```

### 🔧 手动安装

<details>
<summary>展开查看详细安装步骤</summary>

#### 1️⃣ 数据库准备

```sql
-- 创建数据库
CREATE DATABASE charging_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（可选）
CREATE USER 'charging_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON charging_system.* TO 'charging_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 2️⃣ 后端设置

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接

# 数据库迁移
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 启动后端服务
npm run dev
```

#### 3️⃣ 前端设置

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动前端服务
npm run dev
```

</details>

### 🌐 访问应用

启动成功后，访问以下地址：

- **🖥️ 前端界面**: http://localhost:5173
- **🔧 后端API**: http://localhost:3000
- **📊 数据库管理**: http://localhost:5555 (运行 `npm run prisma:studio`)

### 👤 默认账号

| 角色 | 邮箱 | 密码 | 权限 |
|------|------|------|------|
| 管理员 | admin@charging.com | admin123 | 全部功能 |

## 📖 API文档

### 🔐 认证接口

```http
POST   /api/auth/register     # 用户注册
POST   /api/auth/login        # 用户登录
POST   /api/auth/admin/login  # 管理员登录
```

### 👤 用户接口

```http
GET    /api/user/profile      # 获取用户信息
PUT    /api/user/profile      # 更新用户信息
GET    /api/user/records      # 获取充电记录
```

### ⚡ 充电接口

```http
POST   /api/charging/request  # 提交充电申请
GET    /api/charging/queue    # 获取排队状态
PUT    /api/charging/cancel   # 取消充电
GET    /api/charging/status   # 获取充电状态
```

### 🎛️ 管理接口

```http
GET    /api/admin/piles       # 获取充电桩列表
PUT    /api/admin/piles/:id   # 更新充电桩状态
GET    /api/admin/queue       # 获取排队信息
GET    /api/admin/reports     # 获取统计报表
```

### 📊 WebSocket 事件

```javascript
// 客户端监听事件
socket.on('queue-update', (data) => {})      // 排队状态更新
socket.on('charging-update', (data) => {})  // 充电状态更新
socket.on('pile-status', (data) => {})      // 充电桩状态更新

// 客户端发送事件
socket.emit('join-room', { userId })         // 加入房间
socket.emit('charging-command', { action }) // 充电控制命令
```

## 🔧 开发指南

### 📝 代码规范

我们遵循以下代码规范：

- **TypeScript 严格模式**：所有代码必须通过类型检查
- **ESLint 规则**：遵循项目配置的 ESLint 规则
- **命名规范**：使用 camelCase 命名变量和函数，PascalCase 命名组件
- **注释规范**：为复杂逻辑添加清晰的注释说明

### 🧪 测试

```bash
# 运行前端测试
cd frontend
npm test

# 运行后端测试
cd backend
npm test

# 代码覆盖率
npm run test:coverage
```

### 🏗️ 构建部署

```bash
# 构建前端
cd frontend
npm run build

# 构建后端
cd backend
npm run build

# 启动生产环境
npm start
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请按照以下步骤：

### 🔄 工作流程

1. **Fork 项目**到您的GitHub账号
2. **创建功能分支**: `git checkout -b feature/AmazingFeature`
3. **提交更改**: `git commit -m 'Add some AmazingFeature'`
4. **推送分支**: `git push origin feature/AmazingFeature`
5. **创建 Pull Request**

### 📋 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具的变动
```

### 🐛 问题报告

发现bug？请通过 [Issues](https://github.com/ZihanQ/charging-station-system/issues) 报告，包含：

- 🔍 **详细描述**：清楚描述问题现象
- 🔄 **复现步骤**：提供问题复现的步骤
- 💻 **环境信息**：操作系统、浏览器版本等
- 📷 **截图/日志**：如果可能，提供相关截图或错误日志

## 📄 许可证

本项目采用 MIT 许可证 - 详情请查看 [LICENSE](./LICENSE) 文件。

## 🙏 致谢

感谢以下开源项目为本系统提供的技术支持：

- [React](https://reactjs.org/) - 用户界面构建框架
- [Ant Design](https://ant.design/) - 企业级UI设计语言
- [Node.js](https://nodejs.org/) - JavaScript运行时环境
- [Prisma](https://www.prisma.io/) - 现代数据库工具包
- [Socket.io](https://socket.io/) - 实时通信引擎

## 📞 联系我们

- 📧 **邮箱**: [zihanqiu@bupt.edu.cn](mailto:zihanqiu@bupt.edu.cn)
- 💬 **讨论**: [GitHub Discussions](https://github.com/ZihanQ/charging-station-system/discussions)
- 🐛 **问题报告**: [GitHub Issues](https://github.com/ZihanQ/charging-station-system/issues)

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个Star！**

Made with ❤️ by [ZihanQ](https://github.com/ZihanQ)

</div>
</rewritten_file>
