// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { Script } from "forge-std/Script.sol";
import { ERC20True } from "contracts/mocks/ERC20True.sol";

// solhint-disable no-console
import { console } from "forge-std/console.sol";

contract DeployERC20True is Script {
    function run() external {

        vm.startBroadcast();
        ERC20True token = new ERC20True();
        vm.stopBroadcast();

        console.log("ERC20True deployed at:", address(token));
    }
} 