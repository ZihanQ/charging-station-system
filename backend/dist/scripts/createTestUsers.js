"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestUsers = createTestUsers;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function createTestUsers() {
    console.log('开始创建测试用户...');
    const testUsers = [
        {
            id: 'test_user_1',
            username: 'testuser1',
            email: 'test1@example.com',
            password: await bcryptjs_1.default.hash('123456', 10),
            phoneNumber: '13800000001',
            role: 'USER'
        },
        {
            id: 'test_user_2',
            username: 'testuser2',
            email: 'test2@example.com',
            password: await bcryptjs_1.default.hash('123456', 10),
            phoneNumber: '13800000002',
            role: 'USER'
        },
        {
            id: 'test_user_3',
            username: 'testuser3',
            email: 'test3@example.com',
            password: await bcryptjs_1.default.hash('123456', 10),
            phoneNumber: '13800000003',
            role: 'USER'
        },
        {
            id: 'test_user_4',
            username: 'testuser4',
            email: 'test4@example.com',
            password: await bcryptjs_1.default.hash('123456', 10),
            phoneNumber: '13800000004',
            role: 'USER'
        },
        {
            id: 'test_user_5',
            username: 'testuser5',
            email: 'test5@example.com',
            password: await bcryptjs_1.default.hash('123456', 10),
            phoneNumber: '13800000005',
            role: 'USER'
        },
        {
            id: 'test_user_6',
            username: 'testuser6',
            email: 'test6@example.com',
            password: await bcryptjs_1.default.hash('123456', 10),
            phoneNumber: '13800000006',
            role: 'USER'
        },
        {
            id: 'test_user_7',
            username: 'testuser7',
            email: 'test7@example.com',
            password: await bcryptjs_1.default.hash('123456', 10),
            phoneNumber: '13800000007',
            role: 'USER'
        }
    ];
    try {
        for (const user of testUsers) {
            // 检查用户是否已存在
            const existingUser = await prisma.user.findUnique({
                where: { username: user.username }
            });
            if (existingUser) {
                console.log(`用户 ${user.username} 已存在，跳过创建`);
                continue;
            }
            // 创建用户
            await prisma.user.create({
                data: user
            });
            console.log(`用户 ${user.username} 创建成功`);
        }
        console.log('所有测试用户创建完成！');
        console.log('用户信息:');
        console.log('用户名: testuser1-testuser7');
        console.log('密码: 123456');
        console.log('邮箱: test1@example.com - test7@example.com');
    }
    catch (error) {
        console.error('创建测试用户时发生错误:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
// 如果直接运行此脚本
if (require.main === module) {
    createTestUsers();
}
