// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";  /// @dev currently there is no big/serious math operations. Left for the sake of good tone

contract CrowdFundingunding is Ownable{
    using Counters for Counters.Counter;
    using SafeMath for uint256;

    // TODO: Using counters as Id's is a bad pracrtice. UUID is recommended. Also will add constructor for constants and a method to change them.

    Counters.Counter private currentFundId;
    Counters.Counter private currentVoteId;

    address public Admin;

    uint constant createVotingFee = 1 ether;
    uint constant votingDuration = 3 days;

    modifier onlyAdmin() {
        require(msg.sender == Admin);
        _;
    }

    function appointAdmin(address _newAdmin) public onlyOwner {
        Admin = _newAdmin;
    }

    struct Funding {
        string name;
        string description;
        uint goal;
        uint currentFunds; ///@dev probably not needed
        bool isActive;
        address payable recipient;
        uint contributersCount;
    } /// @dev need to be reorganised due to memory efficient use

    struct Voting {
        uint id;
        string title;
        string description;
        uint requestedFunds;
        uint startTime;
        uint votedPositive;
        uint votedNegative;
        bool isActive;
    } /// @dev need to be reorganised due to memory efficient use

    mapping(uint => Voting[]) public fundingVotes;

    mapping(uint => Funding) public crowdFunding;

    mapping(uint => mapping(address => uint)) public contributions;

    mapping(uint => mapping(address => bool)) public hasVoted;

    function createFuncding(string memory _name, string memory _description, uint _goal) public {

        Funding memory newFunding = Funding({
            name: _name,
            description: _description,
            goal: _goal,
            currentFunds: 0,
            isActive: true,
            recipient:payable(msg.sender),
            contributersCount: 0
        });

        uint fundId = currentFundId.current();

        crowdFunding[fundId] = newFunding;

        currentFundId.increment();
    }

    function createVoting(string memory _title, string memory _description, uint _id, uint _requestedFunds) public payable{

        require(msg.sender == crowdFunding[_id].recipient, "You are not this CrowdFunding creator.");

        Voting memory newVoting = Voting({
            id: currentVoteId.current(),
            title: _title,
            description: _description,
            requestedFunds: _requestedFunds,
            startTime: block.timestamp,
            votedPositive: 0,
            votedNegative: 0,
            isActive: true
        });

        currentVoteId.increment();

        fundingVotes[_id].push(newVoting);
    }

    function fund (uint _id) public payable {

        Funding storage funding = crowdFunding[_id];
        require(msg.sender != funding.recipient, "You can't fund yoursel :)");
        require(funding.currentFunds < funding.goal, "This Campaign already achieved their goal"); /// @dev might need to change this require statement as it looks useless
        require(funding.currentFunds + msg.value < funding.goal, "Your donation will exceed proclaimed goal");
        require(funding.isActive, "The funding target is not active.");
        funding.contributersCount.add(1);
        contributions[_id][msg.sender] += msg.value;

    }

    function vote(uint _fundingId, uint _voteId, bool _vote) public {
        Voting storage voting = fundingVotes[_fundingId][_voteId];

        require(voting.isActive, "Voting instance is not active.");
        require(!hasVoted[_voteId][msg.sender], "You have already voted.");

        if (_vote) {
            voting.votedPositive++;
        } else {
            voting.votedNegative++;
        }

        hasVoted[_voteId][msg.sender] = true;
    }

    function isVotingSuccessful(uint _fundingId, uint _voteId) public view returns (bool) {
        Voting storage voting = fundingVotes[_fundingId][_voteId];
        return voting.votedPositive > voting.votedNegative;
    }

    function viewOwnContributions(uint _fundId) public view returns (uint) {
        return contributions[_fundId][msg.sender];
    }

    function viewOwnVotes(uint _voteId) public view returns (bool) {
        return hasVoted[_voteId][msg.sender];
    }

    function endFunding(uint _id) public {
        Funding storage funding = crowdFunding[_id];
        require(msg.sender == funding.recipient, "You are not the owner of this funding campaign");
        require(funding.isActive, "This funding campaign is already finished");
        funding.isActive = false;
    }

    function endVote(uint _fundingId, uint _voteId) public {
        Voting storage voting = fundingVotes[_fundingId][_voteId];
        require(crowdFunding[_fundingId].recipient == msg.sender, "You are not the owner of this funding campaign");
        require(voting.isActive, "Voting isn't active");
        require(voting.startTime + votingDuration >= block.timestamp, "Not enough time has passed");
        require(address(this).balance > voting.requestedFunds);
        voting.isActive = false;
        payable(crowdFunding[_fundingId].recipient).transfer(voting.requestedFunds);
    }

}

// TODO: cover everything with tests
