import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

import type { Signers } from "../types";
import { deployCrowdFundingFixture } from "./CrowdFunding.fixture";
import { expect } from "chai";


describe("Unit tests", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers = await ethers.getSigners();
    this.admin = signers[0];
    this.user1 = signers[1];
    this.user2 = signers[2];
    this.user3 = signers[3];

    this.loadFixture = loadFixture;
  });

    describe("CrowdFunding", function () {
        beforeEach(async function () {
            const { crowdFunding } = await this.loadFixture(deployCrowdFundingFixture);
            this.crowdFunding = crowdFunding;
        });
        it("should create a Funding object", async function () {
            await this.crowdFunding.createFuncding("Test_name", "Test_description", 10000);

            const funding = await this.crowdFunding.crowdFunding(0);

            expect(funding.name).to.equal("Test_name");
            expect(funding.description).to.equal("Test_description");
            expect(funding.goal).to.equal(10000);
            expect(funding.currentFunds).to.equal(0);
            expect(funding.isActive).to.equal(true);
            expect(funding.recipient).to.equal(this.admin.address);
            expect(funding.contributersCount).to.equal(0);
        });
        it("should create Vote object", async function () {
            await this.crowdFunding.createFuncding("Test_name", "Test_description", 10000);
            await this.crowdFunding.createVoting("Test_title", "Test_description", 0, 20000);

            const voting = await this.crowdFunding.fundingVotes(0, 0);

            expect(voting.id).to.equal(0);
            expect(voting.title).to.equal("Test_title");
            expect(voting.description).to.equal("Test_description");
            expect(voting.requestedFunds).to.equal(20000);
            expect(voting.votedPositive).to.equal(0);
            expect(voting.votedNegative).to.equal(0);
            expect(voting.isActive).to.equal(true);
        });
        it("should revert you are no the owner", async function () {
            await this.crowdFunding.createFuncding("Test_name", "Test_description", 10000);
            await expect(
                this.crowdFunding.connect(this.user1).createVoting("Test_title", "Test_description", 0, 20000)
                    ).to.be.revertedWith("You are not this CrowdFunding creator.");
        });
        it("should allow funding if all requirements are met", async function () {
            const _id = 0;
            const goal = 1000000;
        
            await this.crowdFunding.createFuncding("Test_name", "Test_description", goal);
            await this.crowdFunding.connect(this.user1).fund(_id, { value: 500 });
            const funding = await this.crowdFunding.crowdFunding(_id);
            expect(funding.currentFunds).to.equal(500);
            expect(funding.contributersCount).to.equal(1);
            expect(await this.crowdFunding.contributions(_id, this.user1.address)).to.equal(500);
        });
        it("should revert when trying to fund yourself", async function () {
        
            const _id = 0;
            const goal = 1000;
        
            await this.crowdFunding.createFuncding("Test_name", "Test_description", goal);
        
            await expect(
                this.crowdFunding.fund(_id, { value: 500 })
            ).to.be.revertedWith("You can't fund yoursel :)");
        });
        it("should revert when trying to fund beyond the proclaimed goal", async function () {
        
            const _id = 0;
            const goal = 1000;
        
            await this.crowdFunding.createFuncding("Test_name", "Test_description", goal);
        
            await expect(
                this.crowdFunding.connect(this.user1).fund(_id, { value: goal + 1 })
            ).to.be.revertedWith("Your donation will exceed proclaimed goal");
        });
        it("should revert when funding campaign that achieved its goal", async function () {
            const _id = 0;
            const goal = 1000;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", goal);

            await this.crowdFunding.connect(this.user1).fund(_id, { value: goal - 1});
            await expect(
                this.crowdFunding.connect(this.user2).fund(_id, { value: 1 })
            ).to.be.revertedWith("Your donation will exceed proclaimed goal");
        });
        it("should revert if users donation exceeds current goal", async function () {
            const _id = 0;
            const goal = 1000;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", goal);
            await this.crowdFunding.connect(this.user1).fund(_id, { value: goal - 1});
            await expect(
                this.crowdFunding.connect(this.user2).fund(_id, { value: goal })
            ).to.be.revertedWith("Your donation will exceed proclaimed goal");
        });
        it("should revert when funding is not active", async function () {
            const _id = 0;
            const goal = 1000;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", goal);
            await this.crowdFunding.endFunding(0);
            await expect(
                this.crowdFunding.connect(this.user1).fund(_id, { value: goal})
            ).to.be.revertedWith("The funding target is not active.");
        });
        it("should vote if all requirenments are met", async function () {
            const _fundId = 0;
            const _voteId = 0;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 10000);
            await this.crowdFunding.createVoting("Test_title", "Test_description", _voteId, 20000);

            await this.crowdFunding.connect(this.user1).vote(_fundId, _voteId, true);
            expect(
                await this.crowdFunding.connect(this.user1).viewOwnVotes(_voteId)
                ).to.equal(true);
        });
        it("should revert voting is not active", async function () {
            const _fundId = 0;
            const _voteId = 0;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 100000);
            await this.crowdFunding.createVoting("Test_title", "Test_description", _voteId, 2000);
            await this.crowdFunding.connect(this.user1).fund(_fundId, { value: 3000});
            await this.crowdFunding.connect(this.user1).vote(_fundId, _voteId, true);
            await this.crowdFunding.endVote(_fundId, _voteId);
            expect(
                (await this.crowdFunding.fundingVotes(_fundId, _voteId)).isActive
            ).to.equal(false);
        });
        it("should revert voting instance is not active", async function () {
            const _fundId = 0;
            const _voteId = 0;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 100000);
            await this.crowdFunding.createVoting("Test_title", "Test_description", _voteId, 2000);
            await this.crowdFunding.connect(this.user1).fund(_fundId, { value: 3000});
            await this.crowdFunding.endVote(_fundId, _voteId);
            await expect(
                this.crowdFunding.connect(this.user1).vote(_fundId, _voteId, true)
                ).to.be.revertedWith("Voting instance is not active.");
        });
        it("should revert already voted", async function () {
            const _fundId = 0;
            const _voteId = 0;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 10000);
            await this.crowdFunding.createVoting("Test_title", "Test_description", _voteId, 20000);
            await this.crowdFunding.connect(this.user1).vote(_fundId, _voteId, true);
            await expect(
                this.crowdFunding.connect(this.user1).vote(_fundId, _voteId, true)
            ).to.be.revertedWith("You have already voted.");
        });
        it("shoul return correct summ of donations", async function () {
            const _fundId = 0;
            const _value = 3000;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 100000);
            await this.crowdFunding.connect(this.user1).fund(_fundId, { value: _value});

            expect(
                await this.crowdFunding.connect(this.user1).viewOwnContributions(_fundId)
            ).to.equal(_value);
        });
        it("should return correct voting info", async function () {
            const _fundId = 0;
            const _voteId = 0;
            const _choice = true;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 100000);
            await this.crowdFunding.createVoting("Test_title", "Test_description", _voteId, 2000);
            await this.crowdFunding.connect(this.user1).fund(_fundId, { value: 3000});
            await this.crowdFunding.connect(this.user1).vote(_fundId, _voteId, _choice);
            expect(
                await this.crowdFunding.connect(this.user1).viewOwnVotes(_voteId)
            ).to.equal(_choice);
        });
        it("calculates winner correctly", async function () {
            const _fundId = 0;
            const _voteId = 0;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 100000);
            await this.crowdFunding.createVoting("Test_title", "Test_description", _voteId, 2000);
            await this.crowdFunding.connect(this.user1).fund(_fundId, { value: 3000});
            await this.crowdFunding.connect(this.user2).fund(_fundId, { value: 3000});
            await this.crowdFunding.connect(this.user3).fund(_fundId, { value: 3000});
            await this.crowdFunding.connect(this.user1).vote(_fundId, _voteId, true);
            await this.crowdFunding.connect(this.user2).vote(_fundId, _voteId, true);
            await this.crowdFunding.connect(this.user3).vote(_fundId, _voteId, false);
            expect(
                await this.crowdFunding.isVotingSuccessful(_fundId, _voteId)
            ).to.equal(true);
        });
        it("calculates winner correctly", async function () {
            const _fundId = 0;
            const _voteId = 0;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 100000);
            await this.crowdFunding.createVoting("Test_title", "Test_description", _voteId, 2000);
            await this.crowdFunding.connect(this.user1).fund(_fundId, { value: 3000});
            await this.crowdFunding.connect(this.user2).fund(_fundId, { value: 3000});
            await this.crowdFunding.connect(this.user3).fund(_fundId, { value: 3000});
            await this.crowdFunding.connect(this.user1).vote(_fundId, _voteId, true);
            await this.crowdFunding.connect(this.user2).vote(_fundId, _voteId, false);
            await this.crowdFunding.connect(this.user3).vote(_fundId, _voteId, false);
            expect(
                await this.crowdFunding.isVotingSuccessful(_fundId, _voteId)
            ).to.equal(false);
        });
        it("should finish funding", async function () {
            const _fundId = 0;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 100000);
            await this.crowdFunding.endFunding(_fundId);
            expect(
                (await this.crowdFunding.crowdFunding(_fundId)).isActive
            ).to.equal(false);
        });
        it("should revert with you are not the owner of this funding campaign", async function () {
            const _fundId = 0;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 100000);
            
            await expect(
                this.crowdFunding.connect(this.user1).endFunding(_fundId)
            ).to.be.revertedWith("You are not the owner of this funding campaign");
        });
        it("should revert with funding campaign is already finished", async function () {
            const _fundId = 0;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 100000);
            await this.crowdFunding.endFunding(_fundId);

            await expect(
                 this.crowdFunding.endFunding(_fundId)
            ).to.be.revertedWith("This funding campaign is already finished");
        });
        it("should revert with You are not the owner of this funding campaign", async function () {
            const _fundId = 0;
            const _voteId = 0;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 100000);
            await this.crowdFunding.createVoting("Test_title", "Test_description", _voteId, 2000);
            await expect(
                this.crowdFunding.connect(this.user1).endVote(_fundId, _voteId)
            ).to.be.revertedWith("You are not the owner of this funding campaign");
        });
        it("should revert with Voting isn't active", async function () {
            const _fundId = 0;
            const _voteId = 0;

            await this.crowdFunding.createFuncding("Test_name", "Test_description", 100000);
            await this.crowdFunding.createVoting("Test_title", "Test_description", _voteId, 2000);
            await this.crowdFunding.connect(this.user1).fund(_fundId, { value: 99999 })
            await this.crowdFunding.endVote(_fundId, _voteId);
            await expect(
                this.crowdFunding.endVote(_fundId, _voteId)
            ).to.be.revertedWith("Voting isn't active");
        });
    });
});
