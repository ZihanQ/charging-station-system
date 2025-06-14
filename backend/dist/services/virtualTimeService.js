"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.virtualTimeService = exports.VirtualTimeService = void 0;
class VirtualTimeService {
    constructor() {
        this.isVirtualMode = false;
        this.accelerationRate = 1; // 时间加速倍率，1表示正常速度
        this.isPaused = false;
        this.virtualTime = new Date();
        this.lastUpdateTime = Date.now();
    }
    static getInstance() {
        if (!VirtualTimeService.instance) {
            VirtualTimeService.instance = new VirtualTimeService();
        }
        return VirtualTimeService.instance;
    }
    // 获取当前时间（虚拟时间或真实时间）
    getCurrentTime() {
        if (!this.isVirtualMode) {
            return new Date();
        }
        if (this.isPaused) {
            return new Date(this.virtualTime);
        }
        // 计算时间差并应用加速倍率
        const now = Date.now();
        const timeDiff = (now - this.lastUpdateTime) * this.accelerationRate;
        this.virtualTime = new Date(this.virtualTime.getTime() + timeDiff);
        this.lastUpdateTime = now;
        return new Date(this.virtualTime);
    }
    // 设置虚拟时间
    setVirtualTime(time) {
        this.virtualTime = new Date(time);
        this.lastUpdateTime = Date.now();
        this.isVirtualMode = true;
        console.log(`虚拟时间已设置为: ${this.virtualTime.toLocaleString('zh-CN')}`);
    }
    // 设置时间加速倍率
    setAccelerationRate(rate) {
        if (rate <= 0) {
            throw new Error('加速倍率必须大于0');
        }
        // 先更新当前虚拟时间
        this.getCurrentTime();
        this.accelerationRate = rate;
        console.log(`时间加速倍率已设置为: ${rate}x`);
    }
    // 暂停虚拟时间
    pauseVirtualTime() {
        if (this.isVirtualMode) {
            this.getCurrentTime(); // 更新到当前时间
            this.isPaused = true;
            console.log('虚拟时间已暂停');
        }
    }
    // 恢复虚拟时间
    resumeVirtualTime() {
        if (this.isVirtualMode && this.isPaused) {
            this.isPaused = false;
            this.lastUpdateTime = Date.now();
            console.log('虚拟时间已恢复');
        }
    }
    // 关闭虚拟时间模式
    disableVirtualMode() {
        this.isVirtualMode = false;
        this.isPaused = false;
        this.accelerationRate = 1;
        console.log('已切换到真实时间模式');
    }
    // 获取虚拟时间状态
    getStatus() {
        return {
            isVirtualMode: this.isVirtualMode,
            currentTime: this.getCurrentTime(),
            accelerationRate: this.accelerationRate,
            isPaused: this.isPaused
        };
    }
    // 计算基于时间的电价
    getElectricityPrice(time) {
        const currentTime = time || this.getCurrentTime();
        const hour = currentTime.getHours();
        // 峰时：1.0元/度（10:00~15:00，18:00~21:00）
        if ((hour >= 10 && hour < 15) || (hour >= 18 && hour < 21)) {
            return 1.0;
        }
        // 平时：0.7元/度（7:00~10:00，15:00~18:00，21:00~23:00）
        else if ((hour >= 7 && hour < 10) || (hour >= 15 && hour < 18) || (hour >= 21 && hour < 23)) {
            return 0.7;
        }
        // 谷时：0.4元/度（23:00~次日7:00）
        else {
            return 0.4;
        }
    }
    // 获取时间段类型
    getTimeSegment(time) {
        const currentTime = time || this.getCurrentTime();
        const hour = currentTime.getHours();
        if ((hour >= 10 && hour < 15) || (hour >= 18 && hour < 21)) {
            return '峰时';
        }
        else if ((hour >= 7 && hour < 10) || (hour >= 15 && hour < 18) || (hour >= 21 && hour < 23)) {
            return '平时';
        }
        else {
            return '谷时';
        }
    }
}
exports.VirtualTimeService = VirtualTimeService;
// 导出单例实例
exports.virtualTimeService = VirtualTimeService.getInstance();
