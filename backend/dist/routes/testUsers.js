"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const createTestUsers_1 = require("../scripts/createTestUsers");
const router = (0, express_1.Router)();
// 创建测试用户（仅管理员）
router.post('/create', auth_1.authenticateToken, async (req, res) => {
    try {
        // 这里应该添加管理员权限检查
        await (0, createTestUsers_1.createTestUsers)();
        res.json({
            success: true,
            message: '测试用户创建成功',
            data: {
                userInfo: {
                    count: 7,
                    usernames: ['testuser1', 'testuser2', 'testuser3', 'testuser4', 'testuser5', 'testuser6', 'testuser7'],
                    password: '123456',
                    emails: ['test1@example.com', 'test2@example.com', 'test3@example.com', 'test4@example.com', 'test5@example.com', 'test6@example.com', 'test7@example.com']
                }
            }
        });
    }
    catch (error) {
        console.error('创建测试用户错误:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : '创建测试用户失败'
        });
    }
});
exports.default = router;
