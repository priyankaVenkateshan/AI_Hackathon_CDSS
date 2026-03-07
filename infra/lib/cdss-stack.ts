import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import * as path from 'path';

export class CdssStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // --- 1. Network Layer ---
        const vpc = new ec2.Vpc(this, 'CdssVpc', { 
            maxAzs: 2,
            subnetConfiguration: [
                { name: 'Public', subnetType: ec2.SubnetType.PUBLIC },
                { name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
                { name: 'Isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            ],
        });

        // --- 2. Data Layer ---
        const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
            vpc,
            description: 'Allow PostgreSQL access from Lambda',
            allowAllOutbound: true,
        });

        const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
            vpc,
            description: 'Security group for backend Lambdas',
            allowAllOutbound: true,
        });

        dbSecurityGroup.addIngressRule(
            lambdaSecurityGroup,
            ec2.Port.tcp(5432),
            'Allow Lambda access to PostgreSQL'
        );

        // RDS Aurora PostgreSQL Serverless v2 (Refined)
        const cluster = new rds.DatabaseCluster(this, 'CdssDatabase', {
            engine: rds.DatabaseClusterEngine.auroraPostgres({ version: rds.AuroraPostgresEngineVersion.VER_15_4 }),
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            securityGroups: [dbSecurityGroup],
            writer: rds.ClusterInstance.serverlessV2('writer'),
            serverlessV2MinCapacity: 0.5,
            serverlessV2MaxCapacity: 2,
            defaultDatabaseName: 'cdssdb',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // DynamoDB Table (Agent Sessions)
        const sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
            partitionKey: { name: 'session_id', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            timeToLiveAttribute: 'ttl',
            tableName: 'cdss-agent-sessions'
        });

        // --- 3. Bedrock & AI Layer Permissions ---
        const bedrockPolicy = new iam.PolicyStatement({
            actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
            resources: ['*'], // In production, scoped to specific models
        });

        // --- 4. Lambda Agents Layer ---
        const sharedLayer = new lambda.LayerVersion(this, 'SharedLayer', {
            code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/agents/shared')),
            compatibleRuntimes: [lambda.Runtime.PYTHON_3_11],
            description: 'Shared utilities for CDSS agents'
        });

        const createAgent = (name: string, folder: string) => {
            const fn = new lambda.Function(this, `${name}Function`, {
                runtime: lambda.Runtime.PYTHON_3_11,
                handler: 'handler.lambda_handler',
                code: lambda.Code.fromAsset(path.join(__dirname, `../../backend/agents/${folder}`)),
                vpc,
                vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
                securityGroups: [lambdaSecurityGroup],
                environment: {
                    SESSIONS_TABLE: sessionsTable.tableName,
                    DB_CLUSTER_ARN: cluster.clusterArn,
                    DB_SECRET_ARN: cluster.secret?.secretArn || '',
                },
                layers: [sharedLayer],
                timeout: cdk.Duration.seconds(30)
            });
            fn.addToRolePolicy(bedrockPolicy);
            sessionsTable.grantReadWriteData(fn);
            cluster.grantConnect(fn);
            if (cluster.secret) cluster.secret.grantRead(fn);
            return fn;
        };

        const supervisorAgent = createAgent('Supervisor', 'supervisor');
        const patientAgent = createAgent('Patient', 'patient');
        const surgeryAgent = createAgent('SurgeryPlanning', 'surgery_planning');
        // ... Repeat for other agents (OMITTED for brevity in this tech preview)

        // --- 5. EventBus for Inter-Agent Communication ---
        const eventBus = new events.EventBus(this, 'CdssEventBus', { eventBusName: 'cdss-agent-bus' });

        // Route events from Supervisor to sub-agents
        new events.Rule(this, 'SupervisorToSubAgentRule', {
            eventBus,
            eventPattern: { detailType: ['AgentActionRequested'] },
            targets: [new targets.LambdaFunction(patientAgent)] // Specific logic for routing would go here
        });

        // --- 6. API Layer ---
        const api = new apigateway.RestApi(this, 'CdssRestApi', {
            restApiName: 'CDSS Clinical API',
            defaultCorsPreflightOptions: { allowOrigins: apigateway.Cors.ALL_ORIGINS }
        });

        const agentResource = api.root.addResource('agent');
        agentResource.addMethod('POST', new apigateway.LambdaIntegration(supervisorAgent));

        // Dashboard REST API
        const dashboardFn = new lambda.Function(this, 'DashboardFunction', {
            runtime: lambda.Runtime.PYTHON_3_11,
            handler: 'dashboard_handler.lambda_handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../backend/api/rest')),
            vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
            securityGroups: [lambdaSecurityGroup],
            environment: {
                DB_SECRET_ARN: cluster.secret?.secretArn || '',
            },
            layers: [sharedLayer]
        });
        cluster.grantConnect(dashboardFn);
        if (cluster.secret) cluster.secret.grantRead(dashboardFn);
        api.root.addResource('dashboard').addMethod('GET', new apigateway.LambdaIntegration(dashboardFn));

        // WebSocket API (L2 constructs for WebSockets are pending in CDK, using Cfn)
        // For this build, we implement the REST layer as the primary pilot entry point.

        // CloudFormation Outputs
        new cdk.CfnOutput(this, 'RestApiUrl', { value: api.url });
    }
}
