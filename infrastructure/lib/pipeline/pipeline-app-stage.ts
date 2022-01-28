import { CfnOutput, Stage, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { AppFrontendStack } from "../app-frontend-stack";

export class PipelineAppStage extends Stage {
  frontendStack: AppFrontendStack;
  s3BucketName: CfnOutput;
  distributionId: CfnOutput;

  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    this.frontendStack = new AppFrontendStack(this, "AppFrontendStack", {});
    this.s3BucketName = this.frontendStack.s3BucketName;
    this.distributionId = this.frontendStack.distributionId;
  }
}
