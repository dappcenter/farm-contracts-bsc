const chai = require("chai");
const { expect } = chai;
const { MockProvider, solidity } = require('ethereum-waffle');

chai.use(solidity);

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
describe("MochiToken", function() {

  it("Should return the new token", async function() {
    const MochiToken = await ethers.getContractFactory("MochiToken");
    const mochi = await MochiToken.deploy();
    await mochi.deployed();
    expect(await mochi.decimals()).to.equal(18);
    expect(await mochi.name()).to.equal("MochiSwap Token");
  });

  it("Should return the correct name", async function() {
    const MochiToken = await ethers.getContractFactory("MochiToken");
    const mochi = await MochiToken.deploy();
    await mochi.deployed();
    expect(await mochi.name()).to.equal("MochiSwap Token");
  });

  it("Should return the correct symbol", async function() {
    const MochiToken = await ethers.getContractFactory("MochiToken");
    const mochi = await MochiToken.deploy();
    await mochi.deployed();
    expect(await mochi.symbol()).to.equal("MOCHI");
  });

  it("Should return the correct decimals", async function() {
    const MochiToken = await ethers.getContractFactory("MochiToken");
    const mochi = await MochiToken.deploy();
    await mochi.deployed();
    expect(await mochi.decimals()).to.equal(18);
  });

  it("Should return the correct supply cap", async function() {
    const MochiToken = await ethers.getContractFactory("MochiToken");
    const mochi = await MochiToken.deploy();
    await mochi.deployed();
    // const supply = 100000000 * 10 ** 18;
    expect(await mochi.supplyCap()).to.equal("100000000000000000000000000");
  });

  it("Send transaction changes receiver balance", async () => {
    const [wallet, walletTo] = new MockProvider().getWallets();
    await expect(await wallet.sendTransaction({to: walletTo.address, value: 200}))
    .to.changeEtherBalance(walletTo, 200);
  })
  
  it("Send transaction changes receiver balance a different way", async () => {
    const [wallet, walletTo] = new MockProvider().getWallets();
    await expect(() => wallet.sendTransaction({to: walletTo.address, value: 200}))
    .to.changeEtherBalance(walletTo, 200);
  })

  it('should only allow owner to mint token', async () => {
    const [alice, bob, carol] = new MockProvider().getWallets();
    const aliceAddress = await alice.address
    const bobAddress = await bob.address
    const carolAddress = await carol.address
    const MochiToken = await ethers.getContractFactory("MochiToken");
    const mochi = await MochiToken.deploy();
    expect(await mochi.totalSupply()).to.equal("0");
    const mintRes = await mochi.mint(aliceAddress, 100);
    expect(await mochi.totalSupply()).to.equal(100);
    expect(await mochi.balanceOf(aliceAddress)).to.equal(100);
  });

 
  it("Should be able to mint and have the correct total supply", async function() {
    const MochiToken = await ethers.getContractFactory("MochiToken");
    const mochi = await MochiToken.deploy();
    // console.log('Owner (minter): ' + await mochi.owner())
    const preMintCurrentSupply = await mochi.totalSupply();
    // console.log('preMintCurrentSupply: ' + preMintCurrentSupply)
    const amount = ethers.BigNumber.from("1235623")
    const mintAmount = ethers.BigNumber.from(1e18.toString()).mul(amount);
    // console.log('mintAmount: ' + mintAmount)
    await mochi.mint(mochi.address, mintAmount)
    const postMintCurrentSupply = await mochi.totalSupply();
    expect(postMintCurrentSupply).to.equal(mintAmount);
    // console.log('postMintCurrentSupply: ' + ethers.utils.formatEther(postMintCurrentSupply))
  });

  it("should only allow owner to mint token", async function () {
    const MochiToken = await ethers.getContractFactory("MochiToken");
    const mochi = await MochiToken.deploy();
    const [owner, bob, alice, carol ] = await ethers.getSigners();
    await mochi.mint(alice.address, "100")
    await mochi.mint(bob.address, "1000")
    await expect(mochi.connect(bob).mint(carol.address, "1000", { from: bob.address })).to.be.revertedWith(
        "Ownable: caller is not the owner"
    )
    const totalSupply = await mochi.totalSupply()
    const aliceBal = await mochi.balanceOf(alice.address)
    const bobBal = await mochi.balanceOf(bob.address)
    const carolBal = await mochi.balanceOf(carol.address)
    expect(totalSupply).to.equal("1100")
    expect(aliceBal).to.equal("100")
    expect(bobBal).to.equal("1000")
    expect(carolBal).to.equal("0")
  })

  it("Should be able to burn and have the correct total supply", async function() {
    const MochiToken = await ethers.getContractFactory("MochiToken");
    const mochi = await MochiToken.deploy();
    const amount = ethers.BigNumber.from("55555")
    const mintAmount = ethers.BigNumber.from(1e18.toString()).mul(amount);
    await mochi.mint(mochi.address, mintAmount)
    const postMintCurrentSupply = await mochi.totalSupply();
    expect(postMintCurrentSupply).to.equal(mintAmount);

    const preBurnCurrentSupply = await mochi.totalSupply();
    const burnAmount = ethers.BigNumber.from(1e18.toString()).mul(ethers.BigNumber.from("1000"));
    const postBurnTarget = preBurnCurrentSupply.sub(burnAmount)
    await mochi.burn(mochi.address, burnAmount)
    const postBurnCurrentSupply = await mochi.totalSupply();
    expect(postBurnCurrentSupply).to.equal(postBurnTarget);
  });

  // Mock wallet checks
  it("Send transaction changes receiver balance", async () => {
    const [wallet, walletTo] = new MockProvider().getWallets();
    await expect(await wallet.sendTransaction({to: walletTo.address, value: 200}))
    .to.changeEtherBalance(walletTo, 200);
  })

  it("Send transaction changes receiver balance a different way", async () => {
    const [wallet, walletTo] = new MockProvider().getWallets();
    await expect(() => wallet.sendTransaction({to: walletTo.address, value: 200}))
    .to.changeEtherBalance(walletTo, 200);
  })

  it("should transfer tokens properly", async function () {
    const MochiToken = await ethers.getContractFactory("MochiToken");
    const mochi = await MochiToken.deploy();
    const totalSupply1 = await mochi.totalSupply()
    expect(totalSupply1).to.equal("0")
    const [owner, bob, alice, carol ] = await ethers.getSigners();
    await mochi.mint(owner.address, "100")
    await mochi.mint(alice.address, "100")
    await mochi.mint(bob.address, "1000")
    await mochi.transfer(carol.address, "10")
    await mochi.connect(bob).transfer(carol.address, "100", {
    from: bob.address,
    })
    
    const ownerBal = await mochi.balanceOf(owner.address)
    const aliceBal = await mochi.balanceOf(alice.address)
    const bobBal = await mochi.balanceOf(bob.address)
    const carolBal = await mochi.balanceOf(carol.address)
    const totalSupply2 = await mochi.totalSupply()
    expect(totalSupply2).to.equal("1200")
    expect(aliceBal).to.equal("100")
    expect(ownerBal).to.equal("90")
    expect(bobBal).to.equal("900")
    expect(carolBal).to.equal("110")
  })

  it("should fail if you try to do bad transfers", async function () {
      const [owner, bob, alice, carol ] = await ethers.getSigners();
      const MochiToken = await ethers.getContractFactory("MochiToken");
      const mochi = await MochiToken.deploy();
      await mochi.mint(alice.address, "100")
      await expect(mochi.transfer(carol.address, "110")).to.be.revertedWith("BEP20: transfer amount exceeds balance")
      await expect(mochi.connect(bob).transfer(carol.address, "1", { from: bob.address })).to.be.revertedWith(
          "BEP20: transfer amount exceeds balance"
      )
  })

  it('should handle micro transfers locks and delegate', async () => {
    const [admin, user1, user2, carol ] = await ethers.getSigners();
    const adminAddress = await admin.address
    const user1Address = await user1.address
    const user2Address = await user2.address
    const MochiToken = await ethers.getContractFactory("MochiToken");
    const mochi = await MochiToken.deploy();
    // no lock, too small
    await mochi.mint(adminAddress, 1)
    const adminBal1 = await mochi.balanceOf(adminAddress)
    expect(adminBal1).to.equal(1)
    const user1Bal1 = await mochi.balanceOf(user1Address)
    expect(user1Bal1).to.equal(0)

    await mochi.transfer(user1Address, 1)
    const user1Bal2 = await mochi.balanceOf(user1Address)
    expect(user1Bal2).to.equal(1)

    const adminBal2 = await mochi.balanceOf(adminAddress)
    expect(adminBal2).to.equal(0)
    
    const totalSupply = await mochi.totalSupply()
    expect(totalSupply).to.equal(1)

    // try delegating
    await mochi.connect(user1).delegate(user2Address)
    expect(await mochi.getCurrentVotes(user2Address)).to.equal(1)

    // no lock, too small
    await mochi.mint(adminAddress, '10')
    await mochi.transfer(user1Address, '10')
    const user1Bal3 = await mochi.balanceOf(user1Address)
    const adminBal3 = await mochi.balanceOf(adminAddress)
    expect(adminBal3).to.equal('0')
    expect(user1Bal3).to.equal('11')
    
    // delegation updated correctly
    expect(await mochi.getCurrentVotes(user2Address)).to.equal('11')

    await mochi.mint(adminAddress, '100')
    await mochi.transfer(user1Address, '99')
    expect(await mochi.balanceOf(user1Address)).to.equal('110')
    expect(await mochi.balanceOf(adminAddress)).to.equal('1')
    expect(await mochi.totalSupply()).to.equal('111')

    // delegation updated correctly
    expect(await mochi.getCurrentVotes(user2Address)).to.equal('110')

    await mochi.mint(adminAddress, '1000')
    await mochi.transfer(user1Address, '1000')
    expect(await mochi.balanceOf(user1Address)).to.equal('1110')
    expect(await mochi.balanceOf(adminAddress)).to.equal('1')
    expect(await mochi.totalSupply()).to.equal('1111')
    
    // delegation updated correctly
    expect(await mochi.getCurrentVotes(user2Address)).to.equal('1110')
    
    await mochi.mint(adminAddress, '10000')
    await mochi.transfer(user1Address, '10000')
    expect(await mochi.balanceOf(user1Address)).to.equal('11110')
    expect(await mochi.balanceOf(adminAddress)).to.equal('1')
    expect(await mochi.totalSupply()).to.equal('11111')

    // delegation updated correctly
    expect(await mochi.getCurrentVotes(user2Address)).to.equal('11110')
  })

});