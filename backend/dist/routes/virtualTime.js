"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const virtualTimeService_1 = require("../services/virtualTimeService");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// 获取当前虚拟时间状态
router.get('/status', auth_1.authenticateToken, (req, res) => {
    try {
        const status = virtualTimeService_1.virtualTimeService.getStatus();
        res.json({
            success: true,
            data: {
                ...status,
                timeSegment: virtualTimeService_1.virtualTimeService.getTimeSegment(),
                electricityPrice: virtualTimeService_1.virtualTimeService.getElectricityPrice()
            }
        });
    }
    catch (error) {
        console.error('获取虚拟时间状态错误:', error);
        res.status(500).json({
            success: false,
            message: '获取虚拟时间状态失败'
        });
    }
});
// 设置虚拟时间（仅管理员）
router.post('/set', auth_1.authenticateToken, auth_1.requireAdmin, (req, res) => {
    try {
        // 这里应该添加管理员权限检查
        const { time } = req.body;
        if (!time) {
            return res.status(400).json({
                success: false,
                message: '时间参数不能为空'
            });
        }
        const virtualTime = new Date(time);
        if (isNaN(virtualTime.getTime())) {
            return res.status(400).json({
                success: false,
                message: '时间格式无效'
            });
        }
        virtualTimeService_1.virtualTimeService.setVirtualTime(virtualTime);
        res.json({
            success: true,
            message: '虚拟时间设置成功',
            data: {
                currentTime: virtualTimeService_1.virtualTimeService.getCurrentTime(),
                timeSegment: virtualTimeService_1.virtualTimeService.getTimeSegment(),
                electricityPrice: virtualTimeService_1.virtualTimeService.getElectricityPrice()
            }
        });
    }
    catch (error) {
        console.error('设置虚拟时间错误:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '设置虚拟时间失败'
        });
    }
});
// 设置时间加速倍率（仅管理员）
router.post('/acceleration', auth_1.authenticateToken, auth_1.requireAdmin, (req, res) => {
    try {
        const { rate } = req.body;
        if (typeof rate !== 'number' || rate <= 0) {
            return res.status(400).json({
                success: false,
                message: '加速倍率必须是大于0的数字'
            });
        }
        virtualTimeService_1.virtualTimeService.setAccelerationRate(rate);
        res.json({
            success: true,
            message: '时间加速倍率设置成功',
            data: virtualTimeService_1.virtualTimeService.getStatus()
        });
    }
    catch (error) {
        console.error('设置时间加速倍率错误:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '设置时间加速倍率失败'
        });
    }
});
// 暂停虚拟时间（仅管理员）
router.post('/pause', auth_1.authenticateToken, auth_1.requireAdmin, (req, res) => {
    try {
        virtualTimeService_1.virtualTimeService.pauseVirtualTime();
        res.json({
            success: true,
            message: '虚拟时间已暂停',
            data: virtualTimeService_1.virtualTimeService.getStatus()
        });
    }
    catch (error) {
        console.error('暂停虚拟时间错误:', error);
        res.status(500).json({
            success: false,
            message: '暂停虚拟时间失败'
        });
    }
});
// 恢复虚拟时间（仅管理员）
router.post('/resume', auth_1.authenticateToken, auth_1.requireAdmin, (req, res) => {
    try {
        virtualTimeService_1.virtualTimeService.resumeVirtualTime();
        res.json({
            success: true,
            message: '虚拟时间已恢复',
            data: virtualTimeService_1.virtualTimeService.getStatus()
        });
    }
    catch (error) {
        console.error('恢复虚拟时间错误:', error);
        res.status(500).json({
            success: false,
            message: '恢复虚拟时间失败'
        });
    }
});
// 关闭虚拟时间模式（仅管理员）
router.post('/disable', auth_1.authenticateToken, auth_1.requireAdmin, (req, res) => {
    try {
        virtualTimeService_1.virtualTimeService.disableVirtualMode();
        res.json({
            success: true,
            message: '已切换到真实时间模式',
            data: virtualTimeService_1.virtualTimeService.getStatus()
        });
    }
    catch (error) {
        console.error('关闭虚拟时间模式错误:', error);
        res.status(500).json({
            success: false,
            message: '关闭虚拟时间模式失败'
        });
    }
});
exports.default = router;
