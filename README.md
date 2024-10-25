# Sample Hardhat Project Practice

**DoDo：公开拍卖**：
每个购买者在拍卖期间发送他们的竞标到智能合约。 竞标包括发送资金，以便将购买者与他们的竞标绑定。 如果最高出价被提高，之前的出价者就可以拿回他们的竞标资金。 竞价期结束后，出售人可以手动调用合约，收到他们的收益。

**合约部署地址：**
合约地址：0xA5D249A4e214eea915f3F1BC6C15FaBA61a2EA25
snowtrace：https://testnet.snowtrace.io/address/0xA5D249A4e214eea915f3F1BC6C15FaBA61a2EA25#code

## Overview

- 初始化拍卖：合约创建时指定受益人和拍卖持续时间。
- 竞标：用户可以通过 bid 函数进行竞标，竞标金额必须高于当前最高出价，并且需要遵守竞拍冷却时间和拍卖终局延长机制。
- 提取出价：用户可以通过 withdraw 函数撤回未成功的出价。
- 结束拍卖：拍卖结束后，受益人可以通过 auctionEnd 函数提取最高出价。

## Key Functions

1. **constructor**

   - 设置受益人和拍卖结束时间。

2. **bid**

   - 检查拍卖是否已结束。
   - 检查出价者是否在冷却时间内。
   - 检查出价是否高于当前最高出价。
   - 更新最高出价和出价者。
   - 将之前的最高出价加入待退款队列。
   - 记录当前出价时间。
   - 检查是否需要延长拍卖时间并发出事件。

3. **withdraw**

   - 检查是否有待退款金额。
   - 发起转账并更新状态。

4. **auctionEnd**
   - 检查拍卖是否已结束。
   - 检查当前时间是否超过结束时间。
   - 转移最高出价给受益人并发出事件。
