import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";


task("task:deployCrowdFunding")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const signers = await ethers.getSigners();
    const crowdFundingFactory = await ethers.getContractFactory("CrowdFundingunding");
    const crowdFunding = await crowdFundingFactory.connect(signers[0]).deploy();
    await crowdFunding.waitForDeployment();
    console.log("CrowdFunding deployed to: ", await crowdFunding.getAddress());
  });