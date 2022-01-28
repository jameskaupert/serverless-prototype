import {
  aws_cloudfront,
  aws_iam,
  CfnOutput,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";
import { Construct } from "constructs";

export class AppFrontendStack extends Stack {
  frontend: CloudFrontToS3;
  s3BucketName: CfnOutput;
  distributionId: CfnOutput;
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    new CfnOutput(this, "cloudFrontUrl", {
      value:
        "https://console.aws.amazon.com/cloudfront/v3/home?region=us-east-1#/distributions",
    });

    const cloudFrontFunction = new aws_cloudfront.Function(
      this,
      "CloudFrontFunction",
      {
        code: aws_cloudfront.FunctionCode.fromInline(
          "function handler(event) { var response = event.response; \
          var headers = response.headers; \
          headers['strict-transport-security'] = { value: 'max-age=63072000; includeSubdomains; preload'}; \
          headers['content-security-policy'] = { value: \"default-src 'none'; base-uri 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https:; object-src 'none'; frame-ancestors 'none'; font-src 'self' https:; form-action 'self'; manifest-src 'self'; connect-src 'self'\" }; \
          headers['x-frame-options'] = {value: 'DENY'}; \
          headers['x-xss-protection'] = {value: '1; mode=block'}; \
          headers['referrer-policy'] = { value: 'same-origin' }; \
          return response; \
        }"
        ),
      }
    );

    this.frontend = new CloudFrontToS3(this, "CloudFrontS3", {
      cloudFrontDistributionProps: {
        priceClass: aws_cloudfront.PriceClass.PRICE_CLASS_100,
        defaultBehavior: {
          // functionAssociations: [
          //   {
          //     eventType: aws_cloudfront.FunctionEventType.VIEWER_RESPONSE,
          //     function: cloudFrontFunction,
          //   },
          // ],
        },
      },
      originPath: "/web",
    });

    if (!this.frontend.s3Bucket) {
      throw new Error(
        "Did not find a valid s3 bucket to create CfnOutput from"
      );
    }

    this.frontend.s3Bucket.addToResourcePolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        principals: [new aws_iam.ServicePrincipal("codebuild.amazonaws.com")],
        actions: ["s3:PutObject"],
      })
    );

    this.s3BucketName = new CfnOutput(this, "s3BucketName", {
      exportName: `${this.stackName}-s3BucketName`,
      value: this.frontend.s3Bucket.bucketName,
    });

    this.distributionId = new CfnOutput(this, "distributionId", {
      exportName: `${this.stackName}-distributionId`,
      value: this.frontend.cloudFrontWebDistribution.distributionId,
    });
  }
}
