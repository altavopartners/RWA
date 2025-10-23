// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SplitPay {
    error LengthMismatch();
    //error AmountMismatch(uint256 expected, uint256 provided);
    error ZeroRecipient(uint256 index);

    event Paid(address indexed payer, uint256 total, uint256 nRecipients);
    event PaidOne(uint256 indexed index, address indexed to, uint256 amount, bool ok);

    function splitExact(address[] calldata recipients, uint256[] calldata amounts)
        external
        payable
    {
        uint256 n = recipients.length;
        if (n != amounts.length || n == 0) revert LengthMismatch();

        uint256 total;
        unchecked {
            for (uint256 i; i < n; i++) total += amounts[i];
        }
        //if (total != msg.value) revert AmountMismatch(total, msg.value);

        for (uint256 i; i < n; i++) {
            address to = recipients[i];
            if (to == address(0)) revert ZeroRecipient(i);

            (bool ok, ) = payable(to).call{value: amounts[i]}("");

            // log whether it succeeded or failed
            emit PaidOne(i, to, amounts[i], ok);
        }

        emit Paid(msg.sender, msg.value, n);
    }
}
