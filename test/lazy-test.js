const {
  time,
  loadFixture
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { LazyMinter } = require('../utils')

const zeroAddress = "0x0000000000000000000000000000000000000000";
const URI = "ipfs://thisistheuri/image.json";

async function VoucherFixture() {
  const [minter, redeemer] = await ethers.getSigners();

  let LazyNFT = await ethers.getContractFactory("LazyNFT");
  const lazyContract = await LazyNFT.deploy();

  return { lazyContract, minter, redeemer }
}

describe("LazyNFT", function() {
    it("Should deploy", async function() {
        const {lazyContract, minter, redeemer} = await loadFixture(VoucherFixture);
        expect(await lazyContract.minter()).to.be.equal(minter.address);
    });

    it("Should redeem an NFT from a signed voucher", async function() {
        const {lazyContract, minter, redeemer} = await loadFixture(VoucherFixture);

        const lazyMinter = new LazyMinter(lazyContract, minter);
        const voucher = await lazyMinter.createVoucher(1, URI);

        await expect(lazyContract.connect(redeemer).redeem(redeemer.address, voucher))
            .to.emit(lazyContract, 'Transfer')  
            .withArgs(zeroAddress, minter.address, voucher.tokenId)
            .and.to.emit(lazyContract, 'Transfer') 
            .withArgs(minter.address, redeemer.address, voucher.tokenId);
    });
    
    it("Should fail to redeem an NFT that's already been claimed", async function() {
        const {lazyContract, minter, redeemer} = await loadFixture(VoucherFixture);

        const lazyMinter = new LazyMinter(lazyContract, minter)
        const voucher = await lazyMinter.createVoucher(1, URI)

        await expect(lazyContract.connect(redeemer).redeem(redeemer.address, voucher))
            .to.emit(lazyContract, 'Transfer')  
            .withArgs(zeroAddress, minter.address, voucher.tokenId)
            .and.to.emit(lazyContract, 'Transfer')
            .withArgs(minter.address, redeemer.address, voucher.tokenId);

        await expect(lazyContract.connect(redeemer).redeem(redeemer.address, voucher))
        .to.be.revertedWithCustomError(lazyContract,"ERC721InvalidSender");
    });
    
    it("Should fail to redeem a voucher using an unauthorized signer", async function() {
        const {lazyContract, minter, redeemer} = await loadFixture(VoucherFixture);

        const signers = await ethers.getSigners()
        const rando = signers[signers.length-1];
        
        const lazyMinter = new LazyMinter(lazyContract, rando)
        const voucher = await lazyMinter.createVoucher(1, URI)

        await expect(lazyContract.connect(redeemer).redeem(redeemer.address, voucher))
            .to.be.revertedWith('Invalid signature!');
    });
    
    it("Should fail to redeem an NFT voucher that's been modified", async function() {
        const {lazyContract, minter, redeemer} = await loadFixture(VoucherFixture);

        const lazyMinter = new LazyMinter(lazyContract, minter)
        const voucher = await lazyMinter.createVoucher(1, URI)
        voucher.tokenId = 2
        await expect(lazyContract.connect(redeemer).redeem(redeemer.address, voucher))
        .to.be.revertedWith("Not minter address!");
    });
    
    it("Should fail to redeem if payment is < minPrice", async function() {
        const {lazyContract, minter, redeemer} = await loadFixture(VoucherFixture);

        const lazyMinter = new LazyMinter(lazyContract, minter)
        const minPrice = ethers.parseEther("1")
        
        const voucher = await lazyMinter.createVoucher(1, URI , minPrice)
        const payment = minPrice - ethers.parseEther("0.00000001");
        await expect(lazyContract.connect(redeemer).redeem(redeemer.address, voucher, { value: payment }))
            .to.be.revertedWith('Insufficient funds to redeem')
    })
});
