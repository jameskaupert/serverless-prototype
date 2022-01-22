#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { AppFrontendStack } from "../lib/app-frontend-stack";
import { PipelineStack } from "../lib/pipeline-stack";

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

new PipelineStack(app, "PipelineStack", { env });

new AppFrontendStack(app, "AppFrontendStack", {
  env,
});
