#!/bin/bash

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 清屏
clear

echo -e "${CYAN}========================================"
echo -e "     智能充电桩调度计费系统"
echo -e "       启动中，请稍候..."
echo -e "========================================${NC}"
echo

# 检查环境
echo -e "${BLUE}[1/3] 检查环境...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 错误：未检测到 Node.js，请先安装 Node.js 18+${NC}"
    exit 1
fi

if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠️  警告：未检测到 MySQL，请确保 MySQL 服务已启动${NC}"
fi

echo -e "${GREEN}✅ Node.js 环境检查完成${NC}"
echo

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# 启动后端
echo -e "${BLUE}[2/3] 启动后端服务器...${NC}"
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}检测到缺少依赖，正在安装...${NC}"
    npm install
fi

# 在后台启动后端
npm run dev &
BACKEND_PID=$!

echo -e "${GREEN}后端服务器启动中... (PID: $BACKEND_PID)${NC}"
sleep 3

# 启动前端
echo
echo -e "${BLUE}[3/3] 启动前端开发服务器...${NC}"
cd "$SCRIPT_DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}检测到缺少依赖，正在安装...${NC}"
    npm install
fi

# 在后台启动前端
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}前端服务器启动中... (PID: $FRONTEND_PID)${NC}"
sleep 2

echo
echo -e "${CYAN}========================================"
echo -e "         🎉 启动完成！"
echo -e "========================================${NC}"
echo
echo -e "${PURPLE}访问地址：${NC}"
echo -e "${GREEN}📱 前端界面: http://localhost:5173${NC}"
echo -e "${GREEN}🔧 后端API:  http://localhost:3000${NC}"
echo -e "${GREEN}💾 数据库:   运行 'npm run prisma:studio'${NC}"
echo
echo -e "${PURPLE}默认管理员账号：${NC}"
echo -e "${GREEN}📧 邮箱: admin@charging.com${NC}"
echo -e "${GREEN}🔑 密码: admin123${NC}"
echo
echo -e "${YELLOW}按 Ctrl+C 停止所有服务...${NC}"

# 等待用户中断
trap 'echo -e "\n${RED}正在停止服务...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# 保持脚本运行
wait 