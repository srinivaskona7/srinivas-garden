# Network Policies & Telemetry Guide

This directory contains the operational configuration for securing and monitoring traffic in the **Beautiful Garden** cluster. It covers **Ingress** (Incoming), **Egress** (Outgoing), and **Telemetry** (Observability).

## 1. Quick Start: Applying Policies

Run these commands to apply the full security and monitoring suite.

```bash
# 1. Apply Ingress Firewall (IP Acceptlist)
kubectl apply -f ingress/istio-gateway-policy.yaml

# 2. Apply Egress Rules (Allow external APIs like ZenQuotes)
kubectl apply -f egress/zenquotes-egress.yaml
kubectl apply -f egress/k8s-api-egress.yaml

# 3. Apply Telemetry (Enable Jaeger Tracing)
kubectl apply -f telemetry/istio-telemetry.yaml
kubectl apply -f telemetry/jaeger-policy.yaml
```

---

## 2. Traffic Policy Walkthrough

### A. Ingress: The "Front Door" Firewall
*   **File**: `ingress/istio-gateway-policy.yaml`
*   **Mechanism**: Istio `AuthorizationPolicy` on the `istio-ingressgateway`.
*   **Action**: `ALLOW` only specific IPs. All other traffic is **denied** (403 Forbidden).
*   **Why**: Secures the cluster by only allowing trusted locations to access the application.

### B. Egress: Controlled Exits
*   **File**: `egress/zenquotes-egress.yaml`
*   **Mechanism**: Istio `ServiceEntry`.
*   **Action**: Registers `*.zenquotes.io` and `api.adviceslip.com` in the mesh registry.
*   **Why**: By default, we monitor these exits. If we switch `outboundTrafficPolicy` to `REGISTRY_ONLY`, only these registered sites will be reachable.

### C. Traffic Flow & SNAT
*   **External Traffic Policy**: Configured on the Service to control Source IP preservation.
    *   `Cluster` (Default): Traffic hops between nodes. **SNAT** is used to ensure return traffic finds its way back, but Source IP is lost (replaced by Node IP).
    *   `Local`: Traffic stays on the node. Source IP is preserved.

---

## 3. Monitoring & Telemetry (Jaeger)

We use **Jaeger** to visualize requests as they flow through the system.

### How to Access
Since the Jaeger UI is internal, use port-forwarding:

```bash
# Forward Jaeger Query Service (UI) to localhost
kubectl port-forward svc/jaeger-query -n garden 16686:16686
```

### What to Look For
1.  **Open Browser**: [http://localhost:16686](http://localhost:16686)
2.  **Ingress Traces**:
    *   Select Service: `istio-ingressgateway` (if visible).
    *   Shows: Latency and status of requests entering the cluster.
3.  **Egress Traces**:
    *   Select Service: `beautiful-garden`.
    *   Operation: `GET /api/quote`.
    *   Shows: Spans connecting to external APIs (External calls will show as `dns.lookup`, `tcp.connect`).

---

## Directory Structure
*   **`ingress/`**: AuthorizationPolicies for incoming traffic.
*   **`egress/`**: ServiceEntries for outgoing traffic.
*   **`telemetry/`**: Configuration for tracing (Jaeger) and metrics.
