// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { Script } from "forge-std/Script.sol";
import { ERC20True } from "contracts/mocks/ERC20True.sol";

// solhint-disable no-console
import { console } from "forge-std/console.sol";

contract DeployERC20True is Script {
    function run() external {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        uint256 deployerPK = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPK);
        ERC20True token = new ERC20True();
        vm.stopBroadcast();

        console.log("ERC20True deployed at:", address(token));
    }
} 