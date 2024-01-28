const {
  time,
  loadFixture
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("MyERC1155Token", function () {
  let tokenURI = "https://game.example/api/item/{id}.json";

  async function NftFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const MySFToken = await ethers.getContractFactory("MySFToken");
    const mySfToken = await MySFToken.deploy();
    
    return { mySfToken, owner, addr1, addr2}
  }

  describe("Mint Non-Fungible tokens", async () => {
    it("should set the right owner", async () => {
      const {mySfToken, owner, addr1, addr2} = await loadFixture(NftFixture);
      expect(await mySfToken.owner()).to.be.equal(owner.address);     
    });
    
    it("should mint a new token", async() => {
      const {mySfToken, owner, addr1, addr2} = await loadFixture(NftFixture);

      await expect(mySfToken.mint(owner.address,1, 1,"0x00"))
        .not.to.be.reverted;

      expect(await mySfToken.balanceOf(owner.address, 1)).to.be.equal(1);

    });

    it("should mint a hundred tokens", async() => {
      const {mySfToken, owner, addr1, addr2} = await loadFixture(NftFixture);

      await expect(mySfToken.mint(owner.address,1, 100,"0x00"))
        .not.to.be.reverted;

      expect(await mySfToken.balanceOf(owner.address, 1)).to.be.equal(100);
    });

    it("should mint a batch of Tokens", async () => {
      const {mySfToken, owner, addr1, addr2} = await loadFixture(NftFixture);

      await expect(mySfToken.mintBatch(
        owner.address,
        [1,2,3],
        [50,20,100],
        "0x00"))
        .not.to.be.reverted;

      expect(await mySfToken.balanceOf(owner.address, 1)).to.be.equal(50);
      expect(await mySfToken.balanceOf(owner.address, 2)).to.be.equal(20);
      expect(await mySfToken.balanceOf(owner.address, 3)).to.be.equal(100);
    });

    it("should transfer tokens", async () => {
      const {mySfToken, owner, addr1, addr2} = await loadFixture(NftFixture);
      await expect(mySfToken.mint(owner.address,1, 100,"0x00"))
        .not.to.be.reverted;

      await expect(mySfToken.safeTransferFrom(
          owner.address, 
          addr1.address, 
          1,
          40, 
          "0x00"))
          .not.to.be.reverted;
      expect(await mySfToken.balanceOf(owner.address, 1)).to.be.equal(60);
      expect(await mySfToken.balanceOf(addr1.address, 1)).to.be.equal(40);
    });

    it("should be able to burn tokens", async () => {
      const {mySfToken, owner, addr1, addr2} = await loadFixture(NftFixture);
      await expect(mySfToken.mint(owner.address,1, 100,"0x00"))
        .not.to.be.reverted;
      expect(await mySfToken.balanceOf(owner.address, 1)).to.be.equal(100);

      expect(await mySfToken.burn(owner.address, 1, 30))
        .not.to.be.reverted;

      expect(await mySfToken.balanceOf(owner.address, 1)).to.be.equal(70);

    });
  });
});

