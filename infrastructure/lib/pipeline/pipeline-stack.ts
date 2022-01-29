import {
  App,
  aws_codebuild,
  aws_codepipeline,
  aws_codepipeline_actions,
  aws_s3,
  RemovalPolicy,
  SecretValue,
  Stack,
} from "aws-cdk-lib";

export interface PipelineStackProps {}

export class PipelineStack extends Stack {
  constructor(app: App, id: string, props: PipelineStackProps) {
    super(app, id, props);

    const sourceOutput = new aws_codepipeline.Artifact();
    const sourceAction = new aws_codepipeline_actions.GitHubSourceAction({
      actionName: "GitHubSource",
      owner: "jameskaupert",
      repo: "serverless-prototype",
      oauthToken: SecretValue.secretsManager("github-token"),
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
            commands: ["npm i"],
          },
          build: {
            commands: ["npm run build", "npm run cdk synth -- o dist"],
          },
        },
        artifacts: {
          "base-directory": "dist",
          files: ["*AppFrontendStack.template.json"],
        },
      }),
    });
    const cdkBuildOutput = new aws_codepipeline.Artifact("CdkBuildOutput");

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
              actionName: "CDKSynth",
              project: cdkBuild,
              input: sourceOutput,
              outputs: [cdkBuildOutput],
            }),
          ],
        },
      ],
    });
  }
}
