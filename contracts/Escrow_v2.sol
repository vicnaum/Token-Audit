// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

import "./Escrow.sol";
import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";

contract Escrow_v2 is Escrow, BaseRelayRecipient {
    constructor() Escrow() {}

    function _msgSender() internal override(BaseRelayRecipient, ContextUpgradeable) virtual view returns (address payable) {
      return BaseRelayRecipient._msgSender();
    }

    function _msgData() internal override(BaseRelayRecipient, ContextUpgradeable) virtual view returns (bytes memory) {
      return BaseRelayRecipient._msgData();
    }

    function setTrustedForwarder(address _trustedForwarder) external onlyOwner {
        trustedForwarder = _trustedForwarder;
    }

    string public constant override versionRecipient = "2.2.2";
}