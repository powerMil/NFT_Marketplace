//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract Voucher is EIP712 {
  address public minter;
  string private constant SIGNING_DOMAIN = "LazyNFT-Voucher";
  string private constant SIGNATURE_VERSION = "1";

  mapping (address => uint256) pendingWithdrawals;

  constructor(address _minter)
    EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION) {
    minter = _minter;
  }

  struct NFTVoucher {
    uint256 tokenId;
    uint256 minPrice;
    address creator;
    string uri;
    bytes signature;
  }

  function withdraw() public {  
    require(msg.sender == minter, "only minter!");
    address payable receiver = payable(msg.sender);

    uint amount = pendingWithdrawals[receiver];
    pendingWithdrawals[receiver] = 0;
    receiver.transfer(amount);
  }

  function availableToWithdraw() public view returns (uint256) {
    return pendingWithdrawals[msg.sender];
  }
  
  function _hash(NFTVoucher calldata voucher) internal view returns (bytes32) {
    return _hashTypedDataV4(keccak256(abi.encode(
      keccak256("NFTVoucher(uint256 tokenId,uint256 minPrice,address creator,string uri)"),
      voucher.tokenId,
      voucher.minPrice,
      voucher.creator,
      keccak256(bytes(voucher.uri))
    )));
  }

  function getChainID() external view returns (uint256) {
    uint256 id;
    assembly {
        id := chainid()
    }
    return id;
  }

  function _verify(NFTVoucher calldata voucher) internal view returns (address) {
    bytes32 digest = _hash(voucher);
    
    return ECDSA.recover(digest, voucher.signature);
    
  }
}
