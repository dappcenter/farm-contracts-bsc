//SPDX-License-Identifier: None sir.
pragma solidity ^0.7.0;

import "../libraries/ERC20.sol";
import "../libraries/Address.sol";
import "../libraries/Ownable.sol";
import "../interfaces/IUniswapV2Router02.sol";
import "../interfaces/IUniswapV2Factory.sol";
import "../interfaces/IUniswapV2Pair.sol";
import '../interfaces/IWETH.sol';
import '../contracts/KimochiToken.sol';
import "hardhat/console.sol";

contract LiquidityController is Ownable {
  using SafeMath for uint256;
  using Address for address;

  // Events
  event LiquidityAddition(address indexed dst, uint value);
  event LPTokenClaimed(address dst, uint value);
  // event Received(address, uint);

  // Token(s)
  address public tokenAddress;
  
  // Uni stuff
  address public pairAddress;
  address public routerAddress;
  address public factoryAddress;
  IUniswapV2Router02 private uniswapRouterV2;
  IUniswapV2Factory private uniswapFactory;
  
  // Zap
  bool public zapStrategyEnabled;
  
  constructor(address _tokenAddress, address _pairAddress) {
    tokenAddress = _tokenAddress;
    pairAddress = _pairAddress;
    factoryAddress = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    routerAddress = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    zapStrategyEnabled = true;
    // initialize(); 
  }

/**
  So now... 
  A user sends ETH... The contract takes it all.
  Spends half on KIMOCHI
 */
function zapEthToLiquidity() external payable returns (bool) {
  require(zapStrategyEnabled == true, "zapStrategyEnabled: false. plz call again");
  require(msg.value > 0, "Zap: No reason to swap 0 value holmes");
  uniswapRouterV2 = IUniswapV2Router02(routerAddress);
  uniswapFactory = IUniswapV2Factory(factoryAddress);

  console.log("Value of incoming ETH ZAP deposit is: ", msg.value / 1e18, "ETH");
    
  uint256 wethReserves; uint256 tokenReserves;
  
  if(uniswapRouterV2.WETH() == IUniswapV2Pair(pairAddress).token0()) {
    ( wethReserves, tokenReserves,) = IUniswapV2Pair(pairAddress).getReserves();
  } else {
    (tokenReserves, wethReserves,) = IUniswapV2Pair(pairAddress).getReserves();
  }

  // Check things out
  console.log("Solidity -> LiquidityController: Liquidity pool KIMOCHI reserves", tokenReserves.div(1e18));
  console.log("Solidity -> LiquidityController: Liquidity pool WETH reserves", wethReserves.div(1e18));
    
  // We Sell half the ETH
  // TODO: Will there be enuff liquidity to sell half the eth? for now we let ppl get rekt...
  // TODO: Stop the REKT
  console.log("Solidity -> LiquidityController: ZAP TOTAL ETH INPUT: ", msg.value.div(1e18));
    
  // how much we selling for each coin?
  uint256 etherToSell = msg.value.div(2);
  console.log("Solidity -> LiquidityController: ZAP ETH to sell FOR KIMOCHI (1/2): ", etherToSell / 1e18);

  // Set up swap path and SELL IT
  address[] memory uniswapPairPath = new address[](2);
  uniswapPairPath[0] = uniswapRouterV2.WETH();
  uniswapPairPath[1] = address(tokenAddress);
  console.log("Solidity -> LiquidityController: path", uniswapPairPath[0], uniswapPairPath[1]);
  console.log("Solidity -> LiquidityController: etherToSell: ", etherToSell, etherToSell.div(1e18));
  console.log("Solidity -> LiquidityController: KIMOCHI address(this): ", tokenAddress);
  console.log("Solidity -> LiquidityController: WETH address: ", uniswapRouterV2.WETH());
  console.log("Solidity -> LiquidityController: pairWithWETH address", pairAddress);
  console.log("Solidity -> LiquidityController: token0 ", IUniswapV2Pair(pairAddress).token0());
  console.log("Solidity -> LiquidityController: token1 ", IUniswapV2Pair(pairAddress).token1());
 
  IUniswapV2Pair(pairAddress).sync();

  // Buy Kimochi with "ZAPPED" ETH 
  uint[] memory amounts = uniswapRouterV2.swapExactETHForTokens
  {value: etherToSell}
  (
    0, 
    uniswapPairPath,
    address(this),
    2222222222
  );
  
  uint256 tokensPurchased = amounts[amounts.length - 1];
  
  console.log("Solidity -> LiquidityController: amountTokenPurchased ", tokensPurchased.div(1e18));

  IUniswapV2Pair(pairAddress).sync();

  if(uniswapRouterV2.WETH() == IUniswapV2Pair(pairAddress).token0()) {
    ( wethReserves, tokenReserves,) = IUniswapV2Pair(pairAddress).getReserves();
  } else {
    (tokenReserves, wethReserves,) = IUniswapV2Pair(pairAddress).getReserves();
  }
  // Check things out
  console.log("Solidity -> LiquidityController: Liquidity pool KIMOCHI reserves", tokenReserves.div(1e18));
  console.log("Solidity -> LiquidityController: Liquidity pool WETH reserves", wethReserves.div(1e18));
  console.log("Solidity -> LiquidityController: Controller KIMOCHI balance after contract sell", ERC20(address(tokenAddress)).balanceOf(address(this)).div(1e18));
  console.log("Solidity -> LiquidityController: Controller ETH amount to sell", etherToSell.div(1e18));

  // Now commit the other half of the ZAPPED ETH and the KIMOCHI TO LIQUIDITY
  // Need to approve the router to move the msg.senders KIMOCHI
  ERC20(address(tokenAddress)).approve(routerAddress, tokensPurchased);

  uniswapRouterV2.addLiquidityETH
  {value: etherToSell}
  (
    address(tokenAddress),
    tokensPurchased,
    0,
    0,
    address(msg.sender),
    2222222222
  );
  
  console.log("msg.sender LPT BALANCE POST ZAP: ", ERC20(pairAddress).balanceOf(msg.sender) / 1e18);
  return true;
} 

//   // Shut it down for a sec
//   function disableZap() external onlyOwner() {
//     _zapEnabled = false;
//   }
  

}
