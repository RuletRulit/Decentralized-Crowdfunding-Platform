import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const crowdFunding = await deploy("CrowdFunding", {
    from: deployer,
    log: true,
  });

  console.log(`CrowdFunding contract: `, crowdFunding.address);
};
export default func;
func.id = "deploy_crowdFunding"; // id required to prevent reexecution
func.tags = ["CrowdFunding"];
