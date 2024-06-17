import { XRayClient, GetTraceSummariesCommand } from "@aws-sdk/client-xray";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const xrayClient = new XRayClient({ region: "us-east-1" }); // Specify your region
const snsClient = new SNSClient({ region: "us-east-1" }); // Specify your region

const HIGH_LATENCY_THRESHOLD = 3.0; // Define your high latency threshold in seconds
const SNS_TOPIC_ARN = 'arn:aws:sns:<region>:<topic ARN>'; // Replace with your SNS topic ARN

export const handler = async (event) => {
    // Define end time as the current time and start time as 15 minutes ago
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 15 * 60 * 1000); //in miliseconds. So current time - 15 minutes (1min*60seconds*1000miliseconds)

    const params = {
        StartTime: startTime,
        EndTime: endTime,

      //sample params with static value
    //const params = {
        //StartTime: new Date('2024-06-01T00:00:00Z'), // Adjust the start time
        //EndTime: new Date('2024-06-01T00:15:00Z'),   // Adjust the end time
        //FilterExpression: '', // Optional: Add a filter expression if needed
        //TimeRangeType: 'TraceId' // or 'Event'
    };

    try {
        const command = new GetTraceSummariesCommand(params);
        const data = await xrayClient.send(command);
        //console.log('Trace Summaries:', data);

        // Analyze trace summaries for error codes and high latency
        const highLatencyTraces = [];
        const errorTraces = [];

        data.TraceSummaries.forEach(trace => {
            if (trace.HasError || trace.HasFault || trace.HasThrottle) {
                errorTraces.push(trace);
            }
            if (trace.Duration > HIGH_LATENCY_THRESHOLD) {
                highLatencyTraces.push(trace);
            }
        });

        console.log('High Latency Traces:', highLatencyTraces);
        console.log('Error Traces:', errorTraces);

        // Send SNS notification if errors or high latency traces are found
        if (highLatencyTraces.length > 0 || errorTraces.length > 0) {
            let message = `Detected ${errorTraces.length} error trace(s) and ${highLatencyTraces.length} high latency trace(s).\n\n`;

            if (errorTraces.length > 0) {
                message += 'Error Traces:\n';
                errorTraces.forEach(trace => {
                    message += `Trace ID: ${trace.Id}, Duration: ${trace.Duration}\n`;
                });
            }

            if (highLatencyTraces.length > 0) {
                message += '\nHigh Latency Traces:\n';
                highLatencyTraces.forEach(trace => {
                    message += `Trace ID: ${trace.Id}, Duration: ${trace.Duration}\n`;
                });
            }

            const snsParams = {
                Message: message,
                Subject: 'AWS X-Ray Trace Notification',
                TopicArn: SNS_TOPIC_ARN
            };
            const publishCommand = new PublishCommand(snsParams);
            await snsClient.send(publishCommand);
            console.log('SNS notification sent:', message);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                traceSummaries: data,
                highLatencyTraces: highLatencyTraces,
                errorTraces: errorTraces
            }),
        };
    } catch (error) {
        console.error('Error retrieving trace summaries:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error retrieving trace summaries', error }),
        };
    }
};
