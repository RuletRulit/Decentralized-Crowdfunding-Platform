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

    this.loadFixture = loadFixture;
  });

    describe("CrowdFunding", function () {
        beforeEach(async function () {
            const { crowdFunding } = await this.loadFixture(deployCrowdFundingFixture);
            this.crowdFunding = crowdFunding;
        });
        it("Should create a Funding object", async function () {
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
        it("Should create Vote object", async function () {
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
        it("should revert when sender is not the recipient", async function () {
        
            const _title = "Sample Title";
            const _description = "Sample Description";
            const _id = 0;
            const _requestedFunds = 100;
        
            await expect(
              this.crowdFunding.createVoting(
                _title,
                _description,
                _id,
                _requestedFunds
              )
            ).to.be.revertedWith("You are not this CrowdFunding creator.");
        });
        it("should allow funding if all requirements are met", async function () {
            const _id = 0;
            const goal = 1000000;
        
            await this.crowdFunding.createFuncding("Test_name", "Test_description", goal);
        
            await this.crowdFunding.connect(this.user1).fund(_id, { value: 500 });
        
            const funding = await this.crowdFunding.crowdFunding(_id);
            console.log(funding.currentFunds, funding.contributersCount, "pizda");
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
            // expect((await this.crowdFunding.crowdFunding(_id)).currentFunds.to.equal(goal));
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
    });
});
