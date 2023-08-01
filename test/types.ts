import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";

import type { CrowdFundingunding } from "../types/contracts/CrowdFunding.sol";

type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  export interface Context {
    crowdFunding: CrowdFundingunding;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
}
