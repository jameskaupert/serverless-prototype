import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppFrontendStack } from "../app-frontend-stack";

export class PipelineAppStage extends Stage {
  frontendStack: AppFrontendStack;
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    this.frontendStack = new AppFrontendStack(this, "AppFrontendStack", {});
  }
}
