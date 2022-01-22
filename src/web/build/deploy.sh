#!/bin/bash
ng build
aws s3 --recursive cp ./dist s3://appfrontendstack-cloudfronts3s3bucketc1ef554a-7zweaeenp4xv
aws cloudfront create-invalidation --distribution-id E1OWTCXEY7I1QE --paths "/*" --no-cli-pager