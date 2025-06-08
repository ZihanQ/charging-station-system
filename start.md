# 🚗⚡ 智能充电桩调度计费系统 - 快速启动指南

## 📋 项目简介

基于 React + Node.js 的智能充电桩调度计费系统，支持用户排队、智能调度、实时计费等功能。

**技术栈：**
- 前端：React 19 + TypeScript + Vite + Ant Design + Tailwind CSS
- 后端：Node.js + Express + TypeScript + Prisma + MySQL
- 实时通信：Socket.io
- 数据库：MySQL 8.0

## 🏗️ 环境要求

在开始之前，请确保系统已安装以下软件：

- **Node.js**: >= 18.0.0 ([下载地址](https://nodejs.org/))
- **MySQL**: >= 8.0 ([下载地址](https://dev.mysql.com/downloads/))
- **Git**: 最新版本 ([下载地址](https://git-scm.com/))

### 验证环境

```bash
node --version    # 应显示 v18+ 
npm --version     # 应显示 8+
mysql --version   # 应显示 8.0+
```

## 📥 项目克隆与安装

### 1. 克隆项目

```bash
git clone <repository-url>
cd charging-station-system
```

### 2. 安装依赖

```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

## 🗄️ 数据库配置

### 1. 创建 MySQL 数据库

登录 MySQL 并创建数据库：

```sql
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE charging_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建专用用户（可选）
CREATE USER 'charging_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON charging_system.* TO 'charging_user'@'localhost';
FLUSH PRIVILEGES;

# 退出
EXIT;
```

### 2. 配置环境变量

在 `backend` 目录下创建 `.env` 文件：

```bash
cd backend
cp .env.example .env  # 如果存在模板文件
# 或者直接创建 .env 文件
```

`.env` 文件内容：

```env
# MySQL 数据库配置
DATABASE_URL="mysql://root:your_password@localhost:3306/charging_system"

# JWT 密钥（请修改为复杂的随机字符串）
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# 服务器配置
PORT=3000
NODE_ENV=development

# CORS 配置
CORS_ORIGIN=http://localhost:5173
```

**⚠️ 重要：请将 `your_password` 替换为您的 MySQL 密码！**

### 3. 数据库初始化

```bash
cd backend

# 生成 Prisma 客户端
npm run prisma:generate

# 执行数据库迁移（创建表结构）
npm run prisma:migrate

# 运行种子数据（创建初始管理员账号和充电桩）
npm run prisma:seed
```

## 🚀 启动项目

### 方式一：分别启动（推荐开发使用）

**终端 1 - 启动后端：**
```bash
cd backend
npm run dev
```

**终端 2 - 启动前端：**
```bash
cd frontend
npm run dev
```

### 方式二：使用启动脚本

创建 `start-dev.bat`（Windows）或 `start-dev.sh`（Mac/Linux）：

**Windows (start-dev.bat):**
```batch
@echo off
echo 启动充电桩系统...
start "Backend" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak
start "Frontend" cmd /k "cd frontend && npm run dev"
echo 系统启动完成！
pause
```

**Mac/Linux (start-dev.sh):**
```bash
#!/bin/bash
echo "启动充电桩系统..."
cd backend && npm run dev &
cd ../frontend && npm run dev &
wait
```

## 🌐 访问系统

启动成功后，访问以下地址：

- **前端界面**: http://localhost:5173
- **后端API**: http://localhost:3000
- **数据库管理**: http://localhost:5555 (运行 `npm run prisma:studio`)

## 👤 默认登录信息

系统预设了管理员账号：

- **邮箱**: `admin@charging.com`
- **密码**: `admin123`
- **角色**: 管理员

## 📊 功能验证

启动后可以测试以下功能：

- ✅ 用户注册/登录
- ✅ 管理员仪表板
- ✅ 充电桩状态管理
- ✅ 充电排队系统
- ✅ 实时数据同步
- ✅ 费用计算

## 🔧 开发工具

### 数据库管理

```bash
cd backend
npm run prisma:studio
```

### API 测试

推荐使用 Postman 或类似工具测试 API：
- 基础URL: `http://localhost:3000/api`
- 主要路由: `/auth`, `/user`, `/admin`, `/charging`

### 代码检查

```bash
# 前端代码检查
cd frontend
npm run lint

# 后端构建测试
cd backend
npm run build
```

## 🐛 常见问题解决

### 1. 端口占用错误

```bash
# 查看端口占用
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Mac/Linux

# 终止进程（将PID替换为实际进程号）
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # Mac/Linux
```

### 2. 数据库连接失败

- 检查 MySQL 服务是否启动
- 验证 `.env` 文件中的数据库配置
- 确认数据库 `charging_system` 已创建
- 检查用户权限

### 3. Prisma 相关错误

```bash
cd backend

# 重新生成客户端
npm run prisma:generate

# 重置数据库（谨慎使用）
npm run prisma:migrate reset

# 查看数据库状态
npm run prisma:migrate status
```

### 4. Node.js 版本问题

确保使用 Node.js 18+ 版本：

```bash
# 使用 nvm 切换版本（如果已安装）
nvm use 18
nvm use latest
```

### 5. 依赖安装失败

```bash
# 清理缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 或使用 yarn
yarn install
```

## 📝 项目结构

```
charging-station-system/
├── backend/                 # 后端项目
│   ├── src/
│   │   ├── routes/         # 路由文件
│   │   ├── services/       # 业务逻辑
│   │   └── middleware/     # 中间件
│   ├── prisma/
│   │   ├── schema.prisma   # 数据库模型
│   │   └── seed.ts         # 种子数据
│   └── package.json
├── frontend/               # 前端项目
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── pages/          # 页面组件
│   │   └── services/       # API 服务
│   └── package.json
└── README.md
```

## 🤝 开发协作

### Git 工作流

```bash
# 拉取最新代码
git pull origin main

# 创建功能分支
git checkout -b feature/your-feature-name

# 提交代码
git add .
git commit -m "feat: add your feature description"

# 推送分支
git push origin feature/your-feature-name
```

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件和函数添加适当注释
- API 接口要有错误处理

## 📞 技术支持

如遇到问题，请：

1. 查看控制台错误日志
2. 检查 `.env` 配置是否正确
3. 确认数据库连接状态
4. 联系项目负责人

---

**🎉 恭喜！现在您可以开始开发充电桩系统了！**

_最后更新：2024年_ 