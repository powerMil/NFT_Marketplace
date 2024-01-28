const {
  time,
  loadFixture
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const { LazyMinter } = require('../utils')
const zeroAddress = "0x0000000000000000000000000000000000000000";
const price = ethers.parseEther("0.01")

describe("MyERC1155Token", function () {
  let tokenURI = "https://game.example/api/item/{id}.json";

  async function NftFixture() {
    const [owner, seller, buyer] = await ethers.getSigners();

    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy();
    
    return { marketplace, owner, buyer, seller}
  }

  describe("Mint Non-Fungible tokens", async () => {
    it("should be able to list a token", async () => {
      const {marketplace, owner, seller, buyer} = await loadFixture(NftFixture);

      const price = ethers.parseUnits('0.01', 'ether')
      let listingPrice = await marketplace.getListPrice();
      listingPrice = listingPrice.toString()

      expect(await marketplace.createToken(tokenURI, 1, price, { value: listingPrice}))
        .not.to.be.reverted;

    });

    it("should execute sale", async () => {
      const {marketplace, owner, seller, buyer} = await loadFixture(NftFixture);

      const price = ethers.parseUnits('0.01', 'ether')
      let listingPrice = await marketplace.getListPrice();
      listingPrice = listingPrice.toString()

      expect(await marketplace.createToken(tokenURI, 1, price, { value: listingPrice}))
        .not.to.be.reverted;
      expect(await marketplace.balanceOf(marketplace.target, 1)).to.be.equal(1);
      
      expect(await marketplace.connect(buyer).executeSale(1, {value: listingPrice}))
        .not.to.be.reverted;

    });

    it("Should redeem an NFT from a signed voucher", async function() {
        const {marketplace, owner, seller, buyer} = await loadFixture(NftFixture);
        
        const lazyMinter = new LazyMinter(marketplace, owner);
        const voucher = await lazyMinter.createVoucher(1, tokenURI, price);
        
        await expect(marketplace.redeem(owner.address, voucher, 1, {value: price}))
          .not.to.be.reverted;

        expect(await marketplace.balanceOf(owner.address, 1)).to.be.equal(1);
    });
    
  });
    
});

