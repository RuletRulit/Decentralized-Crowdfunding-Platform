import { ethers } from "hardhat";

import type { CrowdFundingunding } from "../../types/contracts/CrowdFunding.sol";
import type { CrowdFundingunding__factory } from "../../types/factories/contracts/CrowdFunding.sol";

export async function deployCrowdFundingFixture(): Promise<{ crowdFunding: CrowdFundingunding }> {
  const signers = await ethers.getSigners();
  const admin = signers[0];

  const crowdFundingFactory = await ethers.getContractFactory("CrowdFundingunding");
  const crowdFunding = await crowdFundingFactory.connect(admin).deploy();
  await crowdFunding.waitForDeployment();

  return { crowdFunding };
}
