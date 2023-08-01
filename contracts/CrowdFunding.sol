// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

import "@openzeppelin/contracts/utils/math/SafeMath.sol";  /// @dev currently there is no big/serious math operations. Left for the sake of good tone

contract CrowdFundingunding is Ownable{
    using Counters for Counters.Counter;
    using SafeMath for uint256;

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
        bool isActive;
        uint startTime;
        uint votedPositive;
        uint votedNegative;
    } /// @dev need to be reorganised due to memory efficient use

    mapping(uint => Voting[]) public fundingVotes;

    mapping(uint => Funding) public crowdFunding;

    mapping(uint => mapping(address => uint)) contributions;

    mapping(uint => mapping(address => bool)) hasVoted;

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

    function createVoting(string memory _title, string memory _description, uint _id) public payable{

        require(msg.sender == crowdFunding[_id].recipient);

        Voting memory newVoting = Voting({
            id: currentVoteId.current(),
            title: _title,
            description: _description,
            isActive: true,
            startTime: block.timestamp,
            votedPositive: 0,
            votedNegative: 0
        });

        currentVoteId.increment();

        fundingVotes[_id].push(newVoting);
    }

    function fund (uint _id) public payable {

        Funding storage funding = crowdFunding[_id]; /// @dev Not sure if it works as a pointer
        require(msg.sender != funding.recipient, "You can't fund yoursel :)");
        require(funding.currentFunds < funding.goal, "This Campaign already achieved their goal"); /// @dev might need to change this require statement as it looks useless
        require(funding.isActive, "The funding target is not active.");
        funding.recipient.transfer(msg.value);
        funding.currentFunds += msg.value;
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

}

    // function vote (uint _fundingId, uint _voteId) public {
    //     Voting[] memory tempList = fundingVotes[_fundingId];
    //     tempList[_voteId].votedPositive.add(1);
    // }

    // function refund() public onlyOwner onlyAdmin {
        
    // }

    // TODO: create a method that will track contributers votes, "onhold" mechanism, cover everything with tests
