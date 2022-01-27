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

    pipeline.addStage(devStage, {
      post: [
        new pipelines.ShellStep("AngularBuild", {
          commands: [
            "echo Building Production App",
            "cd src/web",
            "npm ci",
            "npm run build",
          ],
          primaryOutputDirectory: "./dist",
        }),
      ],
    });
  }
}
