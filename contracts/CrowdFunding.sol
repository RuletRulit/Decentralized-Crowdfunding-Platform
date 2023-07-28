// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";  /// @dev currently there is no big/serious math operations. Left for the sake of good tone

contract CrowdFunding is Ownable{
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    Counters.Counter private currentFundId;

    address public Admin;

    uint constant createVotingFee = 1 ether;

    struct Funding {
        string name;
        string description;
        uint goal;
        uint currentFunds; ///@dev probably not needed
        bool isActive;
        address payable recipient;
    } /// @dev need to be reorganised due to memory efficient use

    struct Voting {
        uint id;
        string title;
        string description;
        bool isActive;
        uint endTime;
        bool currentWinner; ///@dev as we have only 2 options to vote for bool value is perfect
    }

    mapping(uint => Voting[]) public fundingVotes;

    mapping(uint => Funding) public crowdF;

    mapping(address => uint[]) public contributed;

    function createFuncding(string memory _name, string memory _description, uint _goal) public {

        Funding memory newFunding = Funding({
            name: _name,
            description: _description,
            goal: _goal,
            currentFunds: 0,
            isActive: true,
            recipient:payable(msg.sender)
        });

        uint fundId = currentFundId.current();

        crowdF[fundId] = newFunding;

        currentFundId.increment();
    }

    function createVoting(string memory _title, string memory _description, uint _id) public payable{

        require(msg.value >= createVotingFee);
        require(msg.sender == crowdF[_id].recipient);

        Voting memory newVoting = Voting({
            id: _id,
            title: _title,
            description: _description,
            isActive: true,
            endTime: block.timestamp + 3 days,
            currentWinner: false
        });

        fundingVotes[_id].push(newVoting);
    }

    // function vote(uint _id, bool _choice) public {
    //     uint[] memory temp_list = contributed[msg.sender];
        
    // }

    function fund (uint _id) public payable {

        Funding storage funding = crowdF[_id]; /// @dev Not sure if it works as a pointer
        require(msg.sender != funding.recipient, "You can't fund yoursel :)");
        require(funding.currentFunds < funding.goal, "This Campaign already achieved their goal"); /// @dev might need to change this require statement as it looks useless
        require(funding.isActive, "The funding target is not active.");
        funding.recipient.transfer(msg.value);
        funding.currentFunds += msg.value;
        contributed[msg.sender].push(_id); 
    
    }

    function check_goal (uint _id) public view returns (uint) {
        return crowdF[_id].goal;
    }

    function checkCurrentBalance (uint _id) public view returns (uint) {
        return crowdF[_id].currentFunds;
    }

    modifier onlyAdmin() {
        require(msg.sender == Admin);
        _;
    }

    function appointAdmin(address _newAdmin) public onlyOwner {
        Admin = _newAdmin;
    }

    function refund() public onlyOwner onlyAdmin {
        
    }

    // TODO: create a method that will track contributers votes, "onhold" mechanism, cover everything with tests

}
