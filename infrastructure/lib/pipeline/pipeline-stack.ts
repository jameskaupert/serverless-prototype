import {
  App,
  aws_codepipeline,
  aws_codepipeline_actions,
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

    const pipeline = new aws_codepipeline.Pipeline(this, "Pipeline", {
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction],
        },
      ],
    });
  }
}
