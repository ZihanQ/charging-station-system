# ⚡ 快速启动指南

> 适用于有经验的开发者，快速上手项目

## 🚀 一键启动

### Windows 用户
```bash
# 1. 克隆项目
git clone <repository-url>
cd charging-station-system

# 2. 运行启动脚本
start-dev.bat
```

### Mac/Linux 用户
```bash
# 1. 克隆项目
git clone <repository-url>
cd charging-station-system

# 2. 设置权限并启动
chmod +x start-dev.sh
./start-dev.sh
```

## 📋 快速检查清单

在运行启动脚本前，确保：

- [x] 已安装 Node.js 18+
- [x] 已安装 MySQL 8.0+
- [x] MySQL 服务正在运行
- [x] 已创建数据库 `charging_system`
- [x] 已配置 `backend/.env` 文件

## 🔧 环境配置

### 1. 创建数据库
```sql
CREATE DATABASE charging_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 配置环境变量
创建 `backend/.env` 文件：
```env
DATABASE_URL="mysql://root:your_password@localhost:3306/charging_system"
JWT_SECRET="your-jwt-secret"
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

### 3. 数据库初始化
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

## 🌐 访问地址

- 前端：http://localhost:5173
- 后端：http://localhost:3000
- 数据库管理：运行 `npm run prisma:studio`

## 👤 默认账号

- 邮箱：`admin@charging.com`
- 密码：`admin123`

## 🆘 遇到问题？

查看详细文档：[start.md](./start.md) 