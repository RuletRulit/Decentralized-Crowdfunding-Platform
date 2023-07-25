// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract CrowdFunding is Ownable{
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    Counters.Counter private currentFundId;

    struct Funding {
        string name;
        string description;
        uint goal;
        uint currentFunds; ///@dev probably not needed
        bool isActive;
        uint id;
    }

    mapping(uint => Funding) public crowdF;

    Funding[] public fundings;

    function createFuncding(string memory _name, string memory _description, uint _goal) public {

        uint fundId = currentFundId.current();

        Funding memory newFunding = Funding({
            name: _name,
            description: _description,
            goal: _goal,
            currentFunds: 0,
            isActive: true,
            id: fundId
        });

        fundings.push(newFunding);

        currentFundId.increment();
    }

    function fund (uint _id) public payable {
        require(crowdF[_id].isActive, "The funding target is not active.");
        // Rest of the function's logic goes here  
    }

}