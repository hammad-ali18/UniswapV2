const { expect } = require("chai");
const { poll } = require("ethers/lib/utils");
const { waffle,ethers } = require("hardhat");
const { userInfo } = require("os");
const provider = waffle.provider;
const web3 = require("web3");

let v2Factory;
let erc20a;
let erc20b;
let v2Router;
let pairAddress;

let AmountADesired = "2000000";
let AmountBDesired = "1800000";
let AmountAMin = "400000";
let AmountBMin = "300000";

describe('Greeter', () =>{
    
    const [owner, feeToSetter,swapper] = provider.getWallets();
    
    
    before( async () =>{
        Greeter = await ethers.getContractFactory("Greeter");
        greeter = await Greeter.deploy("Hello World");
        
        //creating factory first so we can set fees
        
        let   UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory");
        let   uniswapv2Factory = await UniswapV2Factory.deploy(feeToSetter.address);
        v2Factory = uniswapv2Factory
        console.log("Factory address: ", uniswapv2Factory.address);

        //creation of ERC20 token
        let ERC20A = await ethers.getContractFactory("ERC20");
        let erc20A = await ERC20A.deploy("TokenA","TKA");
        erc20a = erc20A;
        console.log("ERC20A addess: ", erc20A.address);
        
        let ERC20B = await ethers.getContractFactory("ERC20");
        let erc20B = await ERC20B.deploy("TokenB","TKB");
        erc20b = erc20B;
        console.log("ERC20A addess: ", erc20B.address);
  
        


        WETH = await  ethers.getContractFactory("WETH");
        weth = await WETH.deploy();
        console.log("WETH address: ",weth.address);
        
        // router will deal with the v2factory and the UI
        
        let UniswapV2Router = await ethers.getContractFactory("UniswapV2Router02");
        let uniswapv2router = await UniswapV2Router.deploy(v2Factory.address,weth.address)
        v2Router = uniswapv2router
        console.log("uniswapv2router address: ",uniswapv2router.address);

        latestBlock = await ethers.provider.getBlock('latest');
        currentTimestamp = latestBlock.timestamp;
    })

    
    it('Add Liquidity', async () =>{
        console.log("hi add liquidity");


  let CreatePair =   await v2Factory.createPair(erc20a.address, erc20b.address);

  let createPair = await CreatePair.wait();
let createPair2 = await createPair.events[0];
let createPair3 =await createPair2.args['pair'];
console.log(" token pair address: ",createPair3);
pairAddress = createPair3;
// tokens will be minted on owners address and owner will then AddLiquidity to router

let MintA = await erc20a.Mint(owner.address,AmountADesired);

let balanceOfA  =await erc20a.balanceOf(owner.address);
console.log("ERC20 token A balance of owner: ", balanceOfA.toString());

await erc20a.allowance(owner.address,v2Router.address);
await erc20a.approve(v2Router.address,AmountADesired);

let MintB = await erc20b.Mint(owner.address,AmountBDesired);

let balanceOfB  =await erc20b.balanceOf(owner.address);
console.log("ERC20 token B balance of owner: ", balanceOfB.toString());
await erc20b.allowance(owner.address,v2Router.address);
await erc20b.approve(v2Router.address,AmountBDesired);

let AddLiquidity = await v2Router.addLiquidity(
    erc20a.address,
    erc20b.address,
    AmountADesired,
    AmountBDesired,
    AmountAMin,
    AmountBMin,
    owner.address,
    currentTimestamp + 3600
    
)


// console.log("Add liquidity: ",AddLiquidity);
      


})


it("Swap tokens", async()=>{
    console.log("swap tokens failed");
    let amountTokenAIn = "100000"
    let amountTokenBOut = "5000"
    let path = [erc20a.address,erc20b.address];

// await erc20a.allowance(owner.address,v2Router.address);

// The swapper is another guy who will interact with the pool through his matched token on the 
//the pool and will swap his token with the token inside the pool
await erc20a.connect(swapper).approve(v2Router.address, amountTokenAIn);
await erc20b.approve(v2Router.address, amountTokenBOut);

 let getPair =await v2Factory.getPair(erc20a.address, erc20b.address);
 console.log("get pair address(LP Token address) : ",getPair)
 
 let MintSwapper = await erc20a.Mint(swapper.address, amountTokenAIn);
let getBalanceOfSwapperBeforeA = await erc20a.balanceOf(swapper.address);
console.log("swapper balance before A: ", getBalanceOfSwapperBeforeA.toString());
let getBalanceOfSwapperBeforeB = await erc20b.balanceOf(swapper.address);
console.log("swapper balance before B: ", getBalanceOfSwapperBeforeB.toString());
//as swapper will interact so using swapper connection
    let SwapExactTokensForTokens = await v2Router.connect(swapper).swapExactTokensForTokens(amountTokenAIn,amountTokenBOut,path,swapper.address,currentTimestamp + 3600);
     
    let getBalanceOfSwapperAfterA = await erc20a.balanceOf(swapper.address);
    console.log("swapper balance AfterA: ",getBalanceOfSwapperAfterA.toString());
    let getBalanceOfSwapperAfterB = await erc20b.balanceOf(swapper.address);
    console.log("swapper balance AfterB: ",getBalanceOfSwapperAfterB.toString());
    // console.log("SwapExactTokensForTokens: ",SwapExactTokensForTokens);
    

})

it("Remove Liquidity", async()=>{
 //creating an instance of univ2pair so I can pass pair address of my tokens

 // first get the approval for liquidity token getting back to the pool
 let  UniswapV2Pair = await ethers.getContractAt("UniswapV2Pair","0x32a22b9359dF4e57c7643C1d92B9Fcf94f783Ccc");
 
 let getBalance = await UniswapV2Pair.balanceOf(owner.address)
 let liquidity = getBalance.toString();
 console.log("balance of liquidity: ", liquidity);

 let getBalanceOfRouterbeforeliquidityreturn = await UniswapV2Pair.balanceOf(v2Router.address);
 console.log("router balance before liquidity return: ",getBalanceOfRouterbeforeliquidityreturn.toString());

 await UniswapV2Pair.connect(owner).allowance(owner.address,v2Router.address);
   await UniswapV2Pair.connect(owner).approve(v2Router.address,liquidity);
console.log(" approve & allowance of Remove liquidity worked!");
//AS SLIPPAGE IS CAUSING RISE IN RESERVES SO WE HAVE TO REDUCE IT BY 10%


  
let getreserves = await UniswapV2Pair.getReserves();
console.log("getting reserves: ",getreserves[0].toString(),getreserves[1].toString());
//as reserves are returned
let reserve0 =  getreserves[0]*0.9;
let reserve1 =  Math.ceil(getreserves[1]*0.9) ;
console.log("After declinig reserves: ", reserve0, reserve1)

let ownerBalanceBeforeA =  await erc20a.balanceOf(owner.address);

console.log("owner Balance beforeA: ",ownerBalanceBeforeA.toString());
let ownerBalanceBeforeB =  await erc20b.balanceOf(owner.address);
console.log("owner Balance beforeB: ",ownerBalanceBeforeB.toString());


    let removeliquidity  =await v2Router.removeLiquidity(
        erc20a.address,
        erc20b.address,
        liquidity,
       reserve0,
        reserve1,
        owner.address,
        currentTimestamp + 3600
        
    )
    console.log("liquidity removed");
    let ownerBalanceAfterA =  await erc20a.balanceOf(owner.address);
console.log("owner Balance AfterA: ",ownerBalanceAfterA.toString());
let ownerBalanceAfterB =  await erc20b.balanceOf(owner.address);
console.log("owner Balance AfterB: ",ownerBalanceAfterB.toString());

})

   
})