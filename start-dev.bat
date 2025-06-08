@echo off
title 智能充电桩系统启动器
color 0A

echo.
echo ========================================
echo      智能充电桩调度计费系统
echo        启动中，请稍候...
echo ========================================
echo.

echo [1/3] 检查环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到 Node.js，请先安装 Node.js 18+
    pause
    exit /b 1
)

where mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  警告：未检测到 MySQL，请确保 MySQL 服务已启动
)

echo ✅ Node.js 环境检查完成

echo.
echo [2/3] 启动后端服务器...
start "充电桩系统-后端" cmd /k "cd /d %~dp0backend && echo 启动后端服务器... && npm run dev"

echo 等待后端启动...
timeout /t 5 /nobreak >nul

echo.
echo [3/3] 启动前端开发服务器...
start "充电桩系统-前端" cmd /k "cd /d %~dp0frontend && echo 启动前端开发服务器... && npm run dev"

echo.
echo ========================================
echo         🎉 启动完成！
echo ========================================
echo.
echo 访问地址：
echo 📱 前端界面: http://localhost:5173
echo 🔧 后端API:  http://localhost:3000
echo 💾 数据库:   运行 'npm run prisma:studio'
echo.
echo 默认管理员账号：
echo 📧 邮箱: admin@charging.com
echo 🔑 密码: admin123
echo.
echo 按任意键关闭此窗口...
pause >nul 