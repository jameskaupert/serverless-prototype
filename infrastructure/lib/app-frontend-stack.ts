import { aws_cloudfront, Stack, StackProps } from "aws-cdk-lib";
import { CloudFrontToS3 } from "@aws-solutions-constructs/aws-cloudfront-s3";
import { Construct } from "constructs";

export class AppFrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

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

    new CloudFrontToS3(this, "CloudFrontS3", {
      cloudFrontDistributionProps: {
        priceClass: aws_cloudfront.PriceClass.PRICE_CLASS_100,
        defaultBehavior: {
          functionAssociations: [
            {
              eventType: aws_cloudfront.FunctionEventType.VIEWER_RESPONSE,
              function: cloudFrontFunction,
            },
          ],
        },
      },
      originPath: "/web",
    });
  }
}
