const ethers = require('ethers')

const SIGNING_DOMAIN_NAME = "LazyNFT-Voucher"
const SIGNING_DOMAIN_VERSION = "1"

class LazyMinter {

  constructor(contract, signer) {
    this.contract = contract
    this.signer = signer
  }
  
  async createVoucher(tokenId, uri, minPrice = 0) {
    const creator = this.signer.address;
    const voucher = { tokenId, minPrice, creator, uri}
    const domain = await this._signingDomain()
    const types = {
      NFTVoucher: [
        {name: "tokenId", type: "uint256"},
        {name: "minPrice", type: "uint256"},
        {name: "creator", type: "address"},
        {name: "uri", type: "string"}
      ]
    }

    const signature = await this.signer.signTypedData(domain, types, voucher)
    return {
      ...voucher,
      signature,
    }
  }

  async _signingDomain() {
    if (this._domain != null) {
      return this._domain
    }
    const chainId = await this.contract.getChainID()
    this._domain = {
      name: SIGNING_DOMAIN_NAME,
      version: SIGNING_DOMAIN_VERSION,
      verifyingContract: this.contract.target,
      chainId
    }

    return this._domain
  }
}

module.exports = {
  LazyMinter
}