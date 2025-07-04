# 智能充电桩调度计费系统详细需求

本文档是智能充电桩调度计费系统的详细需求说明，目的是形成一个"**统一**"的需求描述，作为后续软件开发活动以及最终的大作业验收标准。

![图1 智能充电站示意图](media/image1.png)

## 1. 充电站结构

如图1所示，充电站分为"充电区"和"等候区"两个区域。电动车到达充电站后首先进入等候区，通过客户端软件向服务器提交充电请求。服务器根据请求充电模式的不同为客户分配两种类型排队号码：
- 如果是请求"快充"模式，则号码首字母为F，后续为F类型排队顺序号(从1开始，如F1、F2)
- 如果是请求"慢充"模式，则号码首字母为T，后续为T类型排队顺序号(从1开始，如T1、T2)

此后，电动车在等候区等待叫号进入充电区。等候区最大车位容量为6。

## 2. 充电区配置

充电区安装有2个快充电桩(A、B)和3个慢充电桩(C、D、E)，快充功率为30度/小时，慢充功率为7度/小时。每个充电桩设置有等长的排队队列，长度为2个车位(只有第一个车位可充电)。当任意充电桩队列存在空位时，系统开始叫号，按照排队顺序号"先来先到"的方式，选取等候区与该充电桩模式匹配的一辆车进入充电区(即快充桩对应F类型号码，慢充桩对应T类型号码)，并按照调度策略加入到匹配充电桩的排队队列中。

## 3. 系统调度策略

系统调度策略为：对应匹配充电模式下（快充/慢充），被调度车辆完成充电所需时长（等待时间+自己充电时间）最短。
- 等待时间 = 选定充电桩队列中所有车辆完成充电时间之和
- 自己充电时间 = 请求充电量/充电桩功率

> 例：如图1所示，快充桩按照F1F2先来先到的顺序进行叫号；慢充桩按照T1T2T3T4先来先到的顺序进行叫号。当F1被调度时，由于快充桩A、B均有空位，它可以分派到这两个队列；同样当T1被调度时，它可以分派到慢充桩D、E两个队列。它们最终被分配到哪个队列需要按照调度策略，即F1完成充电所需时长（等待时间+自己充电时间）最短，以及T1完成充电所需时长（等待时间+自己充电时间）最短。

## 4. 计费规则

### a. 费用构成
- 总费用 = 充电费 + 服务费
- 充电费 = 单位电价 × 充电度数
- 服务费 = 服务费单价 × 充电度数

### b. 单位电价
随时间变化分为三类：
- **峰时**：1.0元/度（10:00~15:00，18:00~21:00）
- **平时**：0.7元/度（7:00~10:00，15:00~18:00，21:00~23:00）
- **谷时**：0.4元/度（23:00~次日7:00）

### c. 服务费单价
0.8元/度

### d. 充电时长计算
充电时长（小时）= 实际充电度数 / 充电功率(度/小时)

## 5. 系统组成

系统由服务器端、用户客户端、管理员客户端组成。

### a. 服务器端功能
- 用户信息维护
- 车辆排队号码生成
- 调度策略生成
- 计费
- 充电桩监控
- 数据统计（详单、报表数据生成）

### b. 用户客户端功能
- 注册、登录
- 查看充电详单信息，至少包含如下字段：
  - 详单编号
  - 详单生成时间
  - 充电桩编号
  - 充电电量
  - 充电时长
  - 启动时间
  - 停止时间
  - 充电费用
  - 服务费用
  - 总费用
- 提交或修改充电请求，包括充电模式（快充/慢充）、本次请求充电量
- 查看本车排队号码
- 查看本充电模式下前车等待数量
- 结束充电

### c. 管理员客户端功能
- 启动/关闭充电桩
- 查看所有充电桩状态（各充电桩的当前状态信息：是否正常工作、系统启动后累计充电次数、充电总时长、充电总电量）
- 查看各充电桩等候服务的车辆信息（用户ID、车辆电池总容量(度)、请求充电量(度)、排队时长）
- 报表展示，至少包含如下字段：
  - 时间(日、周、月)
  - 充电桩编号
  - 累计充电次数
  - 累计充电时长
  - 累计充电量
  - 累计充电费用
  - 累计服务费用
  - 累计总费用

## 6. 用户修改请求场景

系统允许用户在特殊状态下修改充电请求，场景如下：

### a. 修改充电模式(快/慢充)
- **允许在等候区修改**：修改后重新生成排队号，并排到修改后对应模式类型队列的最后一位
- **不允许在充电区修改**：可取消充电重新进入等候区排队

### b. 修改请求充电量
- **允许在等候区修改**：排队号不变
- **不允许在充电区修改**：可取消充电离开或重新进入等候区排队

### c. 取消充电
等候区、充电区均允许

## 7. 充电桩故障处理

若充电桩出现故障(只考虑单一充电桩故障且正好该充电桩有车排队的情况)，则正在被充电的车辆停止计费，本次充电过程对应一条详单。此后系统重新为故障队列中的车辆进行调度。

### a. 优先级调度
暂停等候区叫号服务，当其它同类型充电桩队列有空位时，优先为故障充电桩等候队列提供调度，待该故障队列中全部车辆调度完毕后，再重新开启等候区叫号服务。

### b. 时间顺序调度
暂停等候区叫号服务，将其它同类型充电桩中尚未充电的车辆与故障候队列中车辆合为一组，按照排队号码先后顺序重新调度。调度完毕后，再重新开启等候区叫号服务。

### c. 故障恢复处理
当充电桩故障恢复，若其它同类型充电桩中尚有车辆排队，则暂停等候区叫号服务，将其它同类型充电桩中尚未充电的车辆合为一组，按照排队号码先后顺序重新调度。调度完毕后，再重新开启等候区叫号服务。

## 注意事项

需求描述中所涉及的参数在系统验收测试时可自由设置：
- 快充电桩数(FastChargingPileNum)
- 慢充电桩数(TrickleChargingPileNum)
- 等候区车位容量(WaitingAreaSize)
- 充电桩排队队列长度(ChargingQueueLen)

## 说明

大作业的具体实现技术路线没有限制，大家可以选取自己熟悉的任意开发语言和开发平台。系统验收时，对于有创意的实现方式可以加分。