const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("MyERC721Token", function () {
  let tokenURI = "https://mytokenuri.com";
  let tokenName = "My ERC721 Token";
  let tokenSymbol = "MTK"

  async function NftFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const MyToken = await ethers.getContractFactory("MyToken");
    const myToken = await MyToken.deploy(tokenName, tokenSymbol);
    
    return { myToken, owner, addr1, addr2}
  }

  describe("Mint Non-Fungible tokens", async () => {
    it("should set the right name and symbol", async () => {
      const {myToken, owner, addr1, addr2} = await loadFixture(NftFixture);

      expect(await myToken.name()).to.be.equal(tokenName);
      expect(await myToken.symbol()).to.be.equal(tokenSymbol);
    });

    it("should mint tokens to owner", async () => {
      const {myToken, owner, addr1, addr2} = await loadFixture(NftFixture);
      expect(await myToken.balanceOf(owner.address)).to.equal(0);

      await myToken.safeMint(owner.address, tokenURI);
      expect(await myToken.balanceOf(owner.address)).to.equal(1);
      expect(await myToken.ownerOf(0)).to.equal(owner.address);
      expect(await myToken.tokenURI(0)).to.equal(tokenURI);
    });

    it("Should transfer tokens between accounts", async function () {
      const {myToken, owner, addr1, addr2} = await loadFixture(NftFixture);
      await myToken.safeMint(owner.address, tokenURI);

      // Transfer tokens from owner to addr1.
      await myToken.transferFrom(owner.address, addr1.address, 0);

      // Check balances of first two accounts to ensure transfer occurred.
      expect(await myToken.balanceOf(owner.address)).to.equal(0);
      expect(await myToken.balanceOf(addr1.address)).to.equal(1);
    });
    

  });

});

