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
        address payable recipient;
    } /// @dev need to be reorganised due to memory efficient use

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
            id: fundId,
            recipient:payable(msg.sender)
        });

        fundings.push(newFunding);

        crowdF[fundId] = newFunding;

        currentFundId.increment();
    }

    function fund (uint _id) public payable {
        Funding storage funding = crowdF[_id];
        require(funding.goal < funding.goal); /// @dev might need to change this require statement as it looks useless
        require(funding.isActive, "The funding target is not active.");
        funding.recipient.transfer(msg.value);
        funding.currentFunds += msg.value;
    }

    function check_goal (uint _id) public view returns (uint) {
        return crowdF[_id].goal;
    }

}