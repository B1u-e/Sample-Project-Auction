/*
DoDo：公开拍卖
    合约地址：0xA5D249A4e214eea915f3F1BC6C15FaBA61a2EA25
    snowtrace：https://testnet.snowtrace.io/address/0xA5D249A4e214eea915f3F1BC6C15FaBA61a2EA25#code
    每个购买者在拍卖期间发送他们的竞标到智能合约。竞标包括发送资金，以便将购买者与他们的竞标绑定。
    如果最高出价被提高，之前的出价者就可以拿回他们的竞标资金。竟价期结束后，出售人可以手动调用合约，收到他们的收益。

    竞拍冷却机制(为防止竞拍者连续快速出价，可以设置一个竞拍冷却期。
    每个出价者在一次出价后，需要等待一段时间后才能再次出价，让拍卖过程更具策略性。)

    拍卖终局延长(如果在拍卖快要结束的最后几分钟内有人出价，
    则拍卖时间会自动延长一定的时间（例如5分钟），避免“最后一秒出价”的情况，并让竞拍更加激烈。
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Auction {
    address payable public beneficiary; //最终受益人地址
    uint256 public auctionEndTime; //拍卖结束时间

    uint256 public constant timeExtension = 300; // 拍卖延长时间（5分钟 = 300秒）
    uint256 public constant cooldownTime = 60; // 竞拍冷却时间（60秒）

    address public highestBidder; //最高出价人地址
    uint256 public highestBid; //最高出价金额

    mapping(address => uint256) public pendingReturns; //最高出价人的地址和金额的映射
    mapping(address => uint256) public lastBidTime; // 每个出价者的上次出价时间（用于竞拍冷却时间）

    bool ended; //是否已经结束

    event HighestBidIncreased(address bidder, uint256 amount);
    event AuctionEnded(address winner, uint256 amount);
    event AuctionTimeExtended(uint256 previousEndTime, uint256 newEndTime);

    error AuctionAlreadyEnded();
    error BidNotHighEnough(uint256 highestBid);
    error AuctionNotYetEnded(uint256);
    error AuctionEndAlready();
    error CooldownTime(uint256 timeLeft);

    constructor(address payable beneficiaryAddress, uint256 biddingTime) {
        beneficiary = beneficiaryAddress;
        auctionEndTime = block.timestamp + biddingTime;
    }

    function bid() external payable {
        if (block.timestamp > auctionEndTime) {
            revert AuctionAlreadyEnded();
        }

        // 竞拍冷却机制
        if (block.timestamp < lastBidTime[msg.sender] + cooldownTime) {
            revert CooldownTime(
                lastBidTime[msg.sender] + cooldownTime - block.timestamp
            );
        }

        if (msg.value <= highestBid) {
            revert BidNotHighEnough(highestBid);
        }
        if (highestBid != 0) {
            pendingReturns[highestBidder] = highestBid;
        }

        highestBidder = msg.sender;
        highestBid = msg.value;
        lastBidTime[msg.sender] = block.timestamp;

        // 拍卖终局延长机制
        uint256 previousEndTime = auctionEndTime; // 记录延长前的拍卖结束时间
        if (block.timestamp > auctionEndTime - timeExtension) {
            auctionEndTime = block.timestamp + timeExtension;
            emit AuctionTimeExtended(previousEndTime, auctionEndTime);
        }
        emit HighestBidIncreased(msg.sender, msg.value);
    }

    function withdraw() external returns (bool) {
        uint256 amount = pendingReturns[msg.sender];

        if (amount > 0) {
            pendingReturns[msg.sender] = 0;

            if (!payable(msg.sender).send(amount)) {
                pendingReturns[msg.sender] = amount;
                return false;
            }
        }
        return true;
    }

    function auctionEnd() external {
        if (ended) {
            revert AuctionEndAlready();
        }
        if (block.timestamp < auctionEndTime) {
            revert AuctionNotYetEnded(block.timestamp);
        }

        ended = true;

        beneficiary.transfer(highestBid);

        emit AuctionEnded(highestBidder, highestBid);
    }
}
