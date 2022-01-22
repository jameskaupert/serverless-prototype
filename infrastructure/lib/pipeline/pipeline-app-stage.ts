import { Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppFrontendStack } from "../app-frontend-stack";

export class PipelineAppStage extends Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    new AppFrontendStack(this, "AppFrontendStack", {});
  }
}
