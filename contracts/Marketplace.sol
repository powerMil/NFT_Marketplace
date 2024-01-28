//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC1155URIStorage} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "./Voucher.sol";
import "hardhat/console.sol";

contract Marketplace is Voucher, ERC1155URIStorage {
    uint256 private _tokenIds;
    uint256 private _itemsSold;
    address payable owner;
    uint256 private listPrice = 0.01 ether;

    struct ListedToken {
        uint256 tokenId;
        address payable owner;
        address payable seller;
        uint256 price;
        bool currentlyListed;
    }

    event TokenListedSuccess (
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed
    );

    event LogReceived(address _operator, address _from, uint256 _id, uint256 _value, bytes _data);

    mapping(uint256 => ListedToken) private idToListedToken;

    constructor() Voucher(msg.sender) ERC1155("") {
        owner = payable(msg.sender);
    }

    function updateListPrice(uint256 _listPrice) public {
        require(owner == msg.sender, "Only owner");
        listPrice = _listPrice;
    }

    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds;
        return idToListedToken[currentTokenId];
    }

    function getListedTokenForId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds;
    }

    function createToken(string memory _tokenURI, uint256 _amount, uint256 _price)
        public
        payable
        returns (uint) 
    {
        _tokenIds++;
        uint256 newTokenId = _tokenIds;

        _mint(msg.sender, newTokenId, _amount, "");
        _setURI(newTokenId, _tokenURI);
        createListedToken(newTokenId, _price);

        return newTokenId;
    }

    function createListedToken(uint256 tokenId, uint256 price)
        private
    {
        require(msg.value >= listPrice, "Send the correct price");
        require(price > 0, "Price should be greater than zero");

        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)),
            payable(msg.sender),
            price,
            true
        );
        
        safeTransferFrom(msg.sender, address(this), tokenId, 1, "");
        
        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            price,
            true
        );
    }
    
    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint nftCount = _tokenIds;
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        uint currentIndex = 0;
        uint currentId;
    
        for(uint i=0;i<nftCount;i++)
        {
            currentId = i + 1;
            ListedToken storage currentItem = idToListedToken[currentId];
            tokens[currentIndex] = currentItem;
            currentIndex += 1;
        }           

        return tokens;
    }

    function redeem(
        address redeemer,
        NFTVoucher calldata voucher,
        uint256 _amount
    ) 
        public 
        payable 
        returns (uint256) 
    {
        address signer = _verify(voucher);
        
        require(msg.value >= voucher.minPrice, "Insufficient funds to redeem");
        require(signer == voucher.creator, "Not minter address!");
        require(signer == redeemer, "Invalid signature!");
        
        _mint(redeemer, voucher.tokenId, _amount, "");
        _setURI(voucher.tokenId, voucher.uri);
        
        pendingWithdrawals[signer] += msg.value;

        return voucher.tokenId;
    }
    
    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint totalItemCount = _tokenIds;
        uint itemCount = 0;
        uint currentIndex = 0;
        uint currentId;

        for(uint i=0; i < totalItemCount; i++)
        {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender){
                itemCount += 1;
            }
        }

        ListedToken[] memory items = new ListedToken[](itemCount);
        for(uint i=0; i < totalItemCount; i++) {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender) {
                currentId = i+1;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function executeSale(uint256 tokenId) public payable {
        uint price = idToListedToken[tokenId].price;
        address seller = idToListedToken[tokenId].seller;
        require(msg.value >= price, "Send the right price");

        idToListedToken[tokenId].currentlyListed = true;
        idToListedToken[tokenId].seller = payable(msg.sender);
        _itemsSold++;

        _setApprovalForAll(address(this), msg.sender, true);
        safeTransferFrom(address(this), msg.sender, tokenId, 1, "");
        setApprovalForAll(msg.sender, true);
        
        payable(owner).transfer(price);
        payable(seller).transfer(listPrice);
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4){
        emit LogReceived(operator, from, id, value, data);
        return Marketplace.onERC1155Received.selector;
    }

}
