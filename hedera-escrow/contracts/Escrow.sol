// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Escrow {
    address public buyer;
    address public seller;
    address public arbiter; // bank or platform contract

    uint256 public totalAmount;
    uint256 public releasedAmount;

    bool public buyerApproved;
    bool public sellerApproved;
    bool public buyerApprovedDelivery;
    bool public sellerApprovedDelivery;
    bool public shipmentConfirmed;
    bool public deliveryConfirmed;

    constructor(address _buyer, address _seller, address _arbiter) payable {
        buyer = _buyer;
        seller = _seller;
        arbiter = _arbiter;
        totalAmount = msg.value;
        releasedAmount = 0;
    }

    modifier onlyBuyer() {
        require(msg.sender == buyer || msg.sender == arbiter, "Only buyer or arbiter");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller || msg.sender == arbiter, "Only seller or arbiter");
        _;
    }

    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Only arbiter");
        _;
    }

    function approveByBuyer() external onlyBuyer {
        buyerApproved = true;
    }

    function approveBySeller() external onlySeller {
        sellerApproved = true;
    }

    function approveByBuyerDelivery() external onlyBuyer {
        require(shipmentConfirmed, "Shipment must be confirmed first");
        buyerApprovedDelivery = true;
    }

    function approveBySellerDelivery() external onlySeller {
        require(shipmentConfirmed, "Shipment must be confirmed first");
        sellerApprovedDelivery = true;
    }

    function confirmShipment() external onlyArbiter {
        require(buyerApproved && sellerApproved, "Approvals required");
        require(!shipmentConfirmed, "Already confirmed");
        shipmentConfirmed = true;
        _release( totalAmount / 2 );
    }

    function confirmDelivery() external onlyArbiter {
        require(shipmentConfirmed, "Shipment must be confirmed");
        require(buyerApprovedDelivery && sellerApprovedDelivery, "Delivery approvals required");
        require(!deliveryConfirmed, "Already confirmed");
        deliveryConfirmed = true;
        _release( totalAmount - releasedAmount ); // release remaining
    }

    function _release(uint256 amount) internal {
        require(releasedAmount + amount <= totalAmount, "Exceeds escrow");
        releasedAmount += amount;
        (bool sent,) = payable(seller).call{value: amount}("");
        require(sent, "Payment failed");
    }

    receive() external payable {}
}
