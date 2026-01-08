# Istio Network Policies POC - Sri's Garden

Complete step-by-step documentation for implementing ingress and egress network policies using Istio on a Kyma/Gardener Kubernetes cluster.

---

## Table of Contents

1. [Cluster Overview](#cluster-overview)
2. [Ingress Policy (IP Restriction)](#ingress-policy-ip-restriction)
3. [Egress Policy (Outbound Restriction)](#egress-policy-outbound-restriction)
4. [Testing & Verification](#testing--verification)
5. [Troubleshooting](#troubleshooting)

---

## Cluster Overview

| Component | Value |
|-----------|-------|
| Kubernetes | v1.33.5 (Gardener/Kyma managed) |
| Istio | istiod, istio-cni-node, istio-ingressgateway |
| Application Namespace | `garden` |
| App Deployment | `beautiful-garden` |
| Sidecar Injection | ✅ Enabled (`istio-injection=enabled` label) |

### Prerequisites

```bash
# Verify Istio is running
kubectl get pods -n istio-system --kubeconfig=kubeconfig-trail.yaml

# Verify sidecar injection on namespace
kubectl get ns garden --show-labels --kubeconfig=kubeconfig-trail.yaml

# Verify app has sidecar (2/2 containers)
kubectl get pods -n garden --kubeconfig=kubeconfig-trail.yaml
```

---

## Ingress Policy (IP Restriction)

Restrict all incoming traffic to the cluster from specific IP addresses only.

### Step 1: Find Your Public IP

```bash
curl ifconfig.me
# Example output: 163.223.48.163
```

### Step 2: Patch externalTrafficPolicy

By default, Kubernetes uses `externalTrafficPolicy: Cluster` which NATs the client IP. Change to `Local` to preserve the original client IP:

```bash
kubectl patch svc istio-ingressgateway -n istio-system \
  -p '{"spec":{"externalTrafficPolicy":"Local"}}' \
  --kubeconfig=kubeconfig-trail.yaml
```

**Verify:**
```bash
kubectl get svc istio-ingressgateway -n istio-system \
  -o jsonpath='{.spec.externalTrafficPolicy}' \
  --kubeconfig=kubeconfig-trail.yaml
# Output: Local
```

### Step 3: Create AuthorizationPolicy

**File: `istio-gateway-policy.yaml`**

```yaml
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
metadata:
  name: garden-allow-my-ip
  namespace: istio-system
  labels:
    managed-by: network-policies
spec:
  selector:
    matchLabels:
      app: istio-ingressgateway
  action: ALLOW
  rules:
    - from:
        - source:
            remoteIpBlocks:
              - "163.223.48.163/32"  # Update with your IP
```

### Step 4: Apply the Policy

```bash
kubectl apply -f network-policies/istio-gateway-policy.yaml \
  --kubeconfig=kubeconfig-trail.yaml
```

### Step 5: Test Ingress Restriction

```bash
# From allowed IP - should work
curl -I https://garden.srinivaskona.life

# From different IP (VPN/proxy) - should get 403 Forbidden
# RBAC: access denied
```

### How Ingress Policy Works

```
Internet → AWS NLB → Istio Gateway → AuthorizationPolicy → Pod
                                            ↓
                           Client IP checked against remoteIpBlocks
                           ✅ Allow: 163.223.48.163
                           ❌ Deny: All other IPs (403 Forbidden)
```

---

## Egress Policy (Outbound Restriction)

Restrict all outgoing traffic from pods to only allowed external services.

### Step 1: Understand Istio Egress Options

| Method | Scope | Pros | Cons |
|--------|-------|------|------|
| **Sidecar + ServiceEntry** | Per-namespace or per-pod | Fine-grained control | More YAML |
| **outboundTrafficPolicy: REGISTRY_ONLY** | Mesh-wide (ConfigMap) | Simple | Affects all apps |
| **Egress Gateway** | Centralized | Full visibility | Complex setup |

**Chosen Method:** Sidecar + ServiceEntry (namespace-level control)

### Step 2: Create ServiceEntry for Allowed External Service

Register `zenquotes.io` as a known external service:

```yaml
apiVersion: networking.istio.io/v1
kind: ServiceEntry
metadata:
  name: zenquotes-external
  namespace: garden
  labels:
    managed-by: network-policies
spec:
  hosts:
    - zenquotes.io
  ports:
    - number: 443
      name: https
      protocol: HTTPS
  location: MESH_EXTERNAL
  resolution: DNS
```

### Step 3: Create Sidecar Resource with REGISTRY_ONLY

Restrict pods to only access registered services:

```yaml
apiVersion: networking.istio.io/v1
kind: Sidecar
metadata:
  name: restrict-egress
  namespace: garden
  labels:
    managed-by: network-policies
spec:
  workloadSelector:
    labels:
      app.kubernetes.io/name: beautiful-garden
  outboundTrafficPolicy:
    mode: REGISTRY_ONLY  # Critical: blocks unregistered external hosts
  egress:
    - hosts:
        - "garden/*"        # All services in garden namespace
        - "istio-system/*"  # Istio control plane
        - "kube-system/*"   # DNS resolution
```

### Step 4: Apply Egress Policy

**File: `zenquotes-egress.yaml`** (contains both ServiceEntry and Sidecar)

```bash
kubectl apply -f network-policies/zenquotes-egress.yaml \
  --kubeconfig=kubeconfig-trail.yaml
```

**Verify resources created:**
```bash
kubectl get serviceentries,sidecars -n garden \
  --kubeconfig=kubeconfig-trail.yaml
```

### Step 5: Test Egress Restriction

```bash
# Test ALLOWED external service (zenquotes.io)
kubectl exec -n garden deploy/beautiful-garden -c beautiful-garden \
  --kubeconfig=kubeconfig-trail.yaml -- \
  wget -qO- --timeout=10 https://zenquotes.io/api/random

# Expected: JSON response with quote

# Test BLOCKED external service (any other)
kubectl exec -n garden deploy/beautiful-garden -c beautiful-garden \
  --kubeconfig=kubeconfig-trail.yaml -- \
  wget -qO- --timeout=5 https://api.adviceslip.com/advice

# Expected: Connection reset by peer
```

### How Egress Policy Works

```
Pod (beautiful-garden) → Envoy Sidecar → REGISTRY_ONLY Check
                                              │
         ┌────────────────────────────────────┼────────────────────────────────────┐
         │                                    │                                    │
         ▼                                    ▼                                    ▼
   ✅ zenquotes.io                    ✅ Internal Services              ❌ Blocked
   (ServiceEntry registered)          (garden/*, kube-system/*)     (api.adviceslip.com, etc.)
```

---

## Testing & Verification

### Live Demo Application

The application includes a status page that demonstrates both policies:

**URL:** `https://garden.srinivaskona.life/status`

| API | External Service | Egress Policy | Expected Result |
|-----|------------------|---------------|-----------------|
| `/api/zenquote` | zenquotes.io | ✅ ServiceEntry | Returns quotes |
| `/api/quote` | api.adviceslip.com | ❌ No ServiceEntry | 503 - Blocked |

### Verification Commands

```bash
# Check Istio resources
kubectl get authorizationpolicies --all-namespaces --kubeconfig=kubeconfig-trail.yaml
kubectl get serviceentries,sidecars -n garden --kubeconfig=kubeconfig-trail.yaml

# Check pod sidecar injection (should show 2/2)
kubectl get pods -n garden --kubeconfig=kubeconfig-trail.yaml

# Test egress from pod
kubectl exec -n garden deploy/beautiful-garden -c beautiful-garden \
  --kubeconfig=kubeconfig-trail.yaml -- \
  wget -qO- --timeout=5 https://zenquotes.io/api/random

kubectl exec -n garden deploy/beautiful-garden -c beautiful-garden \
  --kubeconfig=kubeconfig-trail.yaml -- \
  wget -qO- --timeout=5 https://httpbin.org/get 2>&1 || echo "BLOCKED"
```

---

## Troubleshooting

### Issue: Egress Not Being Blocked

**Solution:** Verify `outboundTrafficPolicy: REGISTRY_ONLY` is set in Sidecar

```bash
kubectl get sidecar restrict-egress -n garden -o yaml \
  --kubeconfig=kubeconfig-trail.yaml | grep -A2 outboundTrafficPolicy
```

### Issue: Ingress Policy Not Working (All IPs Allowed)

**Solution:** Check externalTrafficPolicy is `Local`

```bash
kubectl get svc istio-ingressgateway -n istio-system \
  -o jsonpath='{.spec.externalTrafficPolicy}' \
  --kubeconfig=kubeconfig-trail.yaml
```

### Issue: DNS Resolution Failing

**Solution:** Ensure `kube-system/*` is in Sidecar egress hosts

### Rollback Commands

```bash
# Remove egress restrictions
kubectl delete -f network-policies/zenquotes-egress.yaml \
  --kubeconfig=kubeconfig-trail.yaml

# Remove ingress restrictions
kubectl delete -f network-policies/istio-gateway-policy.yaml \
  --kubeconfig=kubeconfig-trail.yaml

# Restore externalTrafficPolicy
kubectl patch svc istio-ingressgateway -n istio-system \
  -p '{"spec":{"externalTrafficPolicy":"Cluster"}}' \
  --kubeconfig=kubeconfig-trail.yaml
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `istio-gateway-policy.yaml` | Ingress AuthorizationPolicy - IP whitelist |
| `zenquotes-egress.yaml` | Egress ServiceEntry + Sidecar - outbound restriction |

---

## Summary

| Policy Type | Implementation | Result |
|-------------|----------------|--------|
| **Ingress** | AuthorizationPolicy + externalTrafficPolicy: Local | Only allowed IPs can access the cluster |
| **Egress** | ServiceEntry + Sidecar (REGISTRY_ONLY) | Pods can only reach registered external services |

**POC Status:** ✅ Complete

**Tested with:**
- Kubernetes v1.33.5
- Istio (Kyma-managed)
- Application: Sri's Garden (beautiful-garden)
