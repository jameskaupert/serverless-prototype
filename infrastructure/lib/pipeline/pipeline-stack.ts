import { pipelines, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { PipelineAppStage } from "./pipeline-app-stage";

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const repoString = "jameskaupert/serverless-prototype";
    const source = pipelines.CodePipelineSource.connection(repoString, "main", {
      connectionArn: `arn:aws:codestar-connections:us-east-1:${this.account}:connection/5c48e23e-e2da-460e-8929-238a5cea87d2`,
    });

    const pipeline = new pipelines.CodePipeline(this, "Pipeline", {
      synth: new pipelines.ShellStep("Synth", {
        input: source,
        primaryOutputDirectory: "infrastructure/cdk.out",
        commands: [
          "cd infrastructure",
          "npm ci",
          "npm run build",
          "npx cdk synth",
        ],
      }),
    });

    const devStage = new PipelineAppStage(this, "Development", {
      env,
    });

    if (!devStage.frontendStack.frontend.s3Bucket) {
      throw new Error("Did not receive an S3 bucket from the frontend stack");
    }

    pipeline.addStage(devStage, {
      pre: [
        new pipelines.ShellStep("AngularBuild", {
          commands: [
            "echo Building Production App",
            "cd src/web",
            "npm ci",
            "npm run build",
          ],
          primaryOutputDirectory: "src/web/dist",
        }),
      ],
      post: [
        new pipelines.ShellStep("AngularBuild", {
          commands: [
            "echo Deploying App to S3",
            `aws s3 --recursive cp src/web/dist s3://${devStage.frontendStack.frontend.s3Bucket.bucketName}`,
            `aws cloudfront create-invalidation --distribution-id ${devStage.frontendStack.frontend.cloudFrontWebDistribution.distributionId} --paths "/*" --no-cli-pager`,
          ],
        }),
      ],
    });
  }
}
