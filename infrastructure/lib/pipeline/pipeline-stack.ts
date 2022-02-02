import {
  App,
  aws_codebuild,
  aws_codepipeline,
  aws_codepipeline_actions,
  aws_iam,
  aws_s3,
  CfnOutput,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { AppFrontendStack } from "../app-frontend-stack";

export interface PipelineStackProps extends StackProps {
  frontendStack: AppFrontendStack;
}

export class PipelineStack extends Stack {
  frontendStack: AppFrontendStack;
  constructor(app: App, id: string, props: PipelineStackProps) {
    super(app, id);

    this.frontendStack = props.frontendStack;

    new CfnOutput(this, "PipelinesUrl", {
      value:
        "https://console.aws.amazon.com/codesuite/codepipeline/pipelines?region=us-east-1",
    });

    const sourceOutput = new aws_codepipeline.Artifact();
    const sourceAction =
      new aws_codepipeline_actions.CodeStarConnectionsSourceAction({
        actionName: "GitHubSource",
        owner: "jameskaupert",
        repo: "serverless-prototype",
        connectionArn: `arn:aws:codestar-connections:us-east-1:${this.account}:connection/5c48e23e-e2da-460e-8929-238a5cea87d2`,
        output: sourceOutput,
        branch: "main",
      });

    const artifactBucket = new aws_s3.Bucket(this, "ArtifactBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const cdkBuild = new aws_codebuild.PipelineProject(this, "CdkBuild", {
      buildSpec: aws_codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          install: {
            commands: [
              "echo Installing Dependencies",
              "cd infrastructure",
              "npm i",
            ],
          },
          build: {
            commands: [
              "echo Synthesizing CDK into Cloudformation",
              "pwd",
              "ls",
              "npm run build",
              "npm run cdk synth",
              "ls cdk.out",
            ],
          },
        },
        artifacts: {
          "base-directory": "infrastructure/cdk.out",
          files: ["*Frontend.template.json"],
        },
      }),
      environment: {
        buildImage: aws_codebuild.LinuxBuildImage.STANDARD_5_0,
      },
    });
    const cdkBuildOutput = new aws_codepipeline.Artifact("CdkBuildOutput");

    const frontendBuild = new aws_codebuild.PipelineProject(
      this,
      "FrontendBuild",
      {
        buildSpec: aws_codebuild.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            install: {
              commands: [
                "echo Installing Dependencies",
                "cd src/web",
                "npm ci",
              ],
            },
            build: {
              commands: [
                "echo Building Frontend App",
                "pwd",
                "ls",
                "npm run build",
              ],
            },
          },
          artifacts: {
            "base-directory": "src/web/dist",
            files: ["**/*"],
          },
        }),
        environment: {
          buildImage: aws_codebuild.LinuxBuildImage.STANDARD_5_0,
        },
      }
    );
    const frontendAppBuildOutput = new aws_codepipeline.Artifact(
      "FrontendAppBuildOutput"
    );

    const invalidCacheBuild = new aws_codebuild.PipelineProject(
      this,
      "InvalidateCacheBuild",
      {
        buildSpec: aws_codebuild.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            build: {
              commands: [
                "echo Invalidating Cache",
                'aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*" --no-cli-pager',
              ],
            },
          },
        }),
        environment: {
          buildImage: aws_codebuild.LinuxBuildImage.STANDARD_5_0,
        },
        environmentVariables: {
          DISTRIBUTION_ID: {
            value: this.frontendStack.distributionId.importValue,
          },
        },
      }
    );

    const distributionArn = `arn:aws:cloudfront::${this.account}:distribution/${this.frontendStack.distributionId.importValue}`;
    invalidCacheBuild.addToRolePolicy(
      new aws_iam.PolicyStatement({
        resources: [distributionArn],
        actions: ["cloudfront:CreateInvalidation"],
        effect: aws_iam.Effect.ALLOW,
      })
    );

    const pipeline = new aws_codepipeline.Pipeline(this, "Pipeline", {
      artifactBucket: artifactBucket,
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction],
        },
        {
          stageName: "Build",
          actions: [
            new aws_codepipeline_actions.CodeBuildAction({
              actionName: "FrontendAppBuild",
              project: frontendBuild,
              input: sourceOutput,
              outputs: [frontendAppBuildOutput],
            }),
            new aws_codepipeline_actions.CodeBuildAction({
              actionName: "CDKSynth",
              project: cdkBuild,
              input: sourceOutput,
              outputs: [cdkBuildOutput],
            }),
          ],
        },
        {
          stageName: "DeployDev",
          actions: [
            new aws_codepipeline_actions.CloudFormationCreateUpdateStackAction({
              actionName: "DeployFrontendInfrastructure",
              templatePath: cdkBuildOutput.atPath("Frontend.template.json"),
              stackName: "FrontendAppStack",
              adminPermissions: true,
            }),
            new aws_codepipeline_actions.S3DeployAction({
              actionName: "DeployFrontendAppCode",
              bucket: aws_s3.Bucket.fromBucketName(
                this,
                "bucketName",
                this.frontendStack.s3BucketName.importValue
              ),
              input: frontendAppBuildOutput,
              runOrder: 2,
            }),
            new aws_codepipeline_actions.CodeBuildAction({
              actionName: "InvalidateCache",
              input: frontendAppBuildOutput,
              project: invalidCacheBuild,
              runOrder: 3,
            }),
          ],
        },
      ],
    });
  }
}
