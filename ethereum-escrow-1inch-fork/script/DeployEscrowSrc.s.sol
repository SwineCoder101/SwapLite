// SPDX-License-Identifier: MIT

pragma solidity 0.8.23;

import { Script } from "forge-std/Script.sol";
import { IERC20 } from "openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

import { EscrowSrc } from "contracts/EscrowSrc.sol";

// solhint-disable no-console
import { console } from "forge-std/console.sol";

contract DeployEscrowSrc is Script {
    uint32 public constant RESCUE_DELAY = 691200; // 8 days
    IERC20 public constant ACCESS_TOKEN = IERC20(0xC2c4fE863EC835D7DdbFE91Fe33cf1C7Df45Fa7C);
    
    function run() external {
        address deployer = vm.envAddress("DEPLOYER_ADDRESS");
        address feeBankOwner = deployer;

        vm.startBroadcast();
        EscrowSrc escrow = new EscrowSrc(RESCUE_DELAY, ACCESS_TOKEN);
        vm.stopBroadcast();

        console.log("Escrow Factory deployed at: ", address(escrowFactory));
    }
}