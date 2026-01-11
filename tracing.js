/**
 * OpenTelemetry Tracing Configuration
 * 
 * This file must be imported BEFORE any other modules in server.js
 * to ensure all requests are properly instrumented.
 */

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { Resource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } = require('@opentelemetry/semantic-conventions');

// Service configuration
const serviceName = process.env.OTEL_SERVICE_NAME || 'beautiful-garden';
const serviceVersion = process.env.npm_package_version || '1.0.0';

// OTLP endpoint - can be overridden by environment variable
// Default: Jaeger collector in the same namespace
const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger-collector.garden.svc.cluster.local:4318/v1/traces';

console.log(`🔭 OpenTelemetry: Initializing tracing for ${serviceName}@${serviceVersion}`);
console.log(`🔭 OpenTelemetry: Sending traces to ${otlpEndpoint}`);

// Configure the OTLP exporter
const traceExporter = new OTLPTraceExporter({
    url: otlpEndpoint,
    headers: {},
});

// Configure the SDK with auto-instrumentation
const sdk = new NodeSDK({
    resource: new Resource({
        [ATTR_SERVICE_NAME]: serviceName,
        [ATTR_SERVICE_VERSION]: serviceVersion,
        'deployment.environment': process.env.NODE_ENV || 'development',
    }),
    traceExporter,
    instrumentations: [
        getNodeAutoInstrumentations({
            // Disable fs instrumentation to reduce noise
            '@opentelemetry/instrumentation-fs': { enabled: false },
            // Configure HTTP instrumentation
            '@opentelemetry/instrumentation-http': {
                ignoreIncomingPaths: ['/health/live', '/health/ready'],
            },
            // Configure Express instrumentation
            '@opentelemetry/instrumentation-express': {
                enabled: true,
            },
        }),
    ],
});

// Start the SDK
try {
    sdk.start();
    console.log('🔭 OpenTelemetry: Tracing initialized successfully');
} catch (error) {
    console.error('🔭 OpenTelemetry: Failed to initialize tracing:', error);
}

// Graceful shutdown
process.on('SIGTERM', () => {
    sdk.shutdown()
        .then(() => console.log('🔭 OpenTelemetry: Tracing terminated'))
        .catch((error) => console.error('🔭 OpenTelemetry: Error terminating tracing:', error));
});

module.exports = { sdk };
