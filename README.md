# AWS X-Ray Notification using AWS Lambda and AWS SNS
This sample code allows you to retrieve AWS XRay API - GetTraceSummaries (https://docs.aws.amazon.com/xray/latest/api/API_GetTraceSummaries.html) for Fault and Latency Notification using Lambda and SNS.

1. Setup IAM Role for AWS Lambda
   a) Managed Policies - Basic Execution Role for Lambda to save console.logs to Cloudwatch Logs
   b) Managed Policies - AWS X-Ray Read-Access (you can also specify only GetTraceSummaries)
   c) Inline Policies - To send notification to SNS
2. Setup SNS
3. Setup EventBridge
   a) Trigger Lambda
   b) Scheduled timer for eg: every 15 minutes
4. Setup Lambda
   a) Choose NodeJS
   b) Refer to the code sample
   c) Modify the High Latency value, SNS Topic ARN and Start Time/End Time
   
## Disclaimer: This is a sample code and no guarantees are provided. It doesn't handle things like pagination. 


