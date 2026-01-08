# Istio Egress Policy Rules - All 3 Levels

This document contains egress policy examples for restricting outbound traffic to `zenquotes.io` at three different scopes.

---

## Overview

| Level | Scope | workloadSelector | Sidecar Namespace |
|-------|-------|------------------|-------------------|
| Pod-level | Specific pods only | ✅ Required | App namespace |
| Namespace-level | All pods in namespace | ❌ None | App namespace |
| Cluster-level | All pods in mesh | ❌ None | `istio-system` |

---

## 1️⃣ Pod-Level Egress

**Scope:** Only pods matching specific labels

**Use case:** Different apps in same namespace need different egress rules

```yaml
# zenquotes-egress-pod-level.yaml
---
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

---
apiVersion: networking.istio.io/v1
kind: Sidecar
metadata:
  name: restrict-egress-pod
  namespace: garden
  labels:
    managed-by: network-policies
spec:
  # ⬇️ ONLY affects pods with this label
  workloadSelector:
    labels:
      app.kubernetes.io/name: beautiful-garden
  outboundTrafficPolicy:
    mode: REGISTRY_ONLY
  egress:
    - hosts:
        - "garden/*"        # Internal services + ServiceEntry
        - "istio-system/*"  # Istio control plane
        - "kube-system/*"   # DNS resolution
```

**Apply:**
```bash
kubectl apply -f zenquotes-egress-pod-level.yaml --kubeconfig=kubeconfig-trail.yaml
```

---

## 2️⃣ Namespace-Level Egress

**Scope:** All pods in the namespace

**Use case:** All apps in namespace share the same egress rules

```yaml
# zenquotes-egress-namespace-level.yaml
---
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

---
apiVersion: networking.istio.io/v1
kind: Sidecar
metadata:
  name: restrict-egress-namespace
  namespace: garden
  labels:
    managed-by: network-policies
spec:
  # ⬇️ NO workloadSelector = applies to ALL pods in garden namespace
  outboundTrafficPolicy:
    mode: REGISTRY_ONLY
  egress:
    - hosts:
        - "garden/*"        # Internal services + ServiceEntry
        - "istio-system/*"  # Istio control plane
        - "kube-system/*"   # DNS resolution
```

**Apply:**
```bash
kubectl apply -f zenquotes-egress-namespace-level.yaml --kubeconfig=kubeconfig-trail.yaml
```

---

## 3️⃣ Cluster-Level Egress (Mesh-wide)

**Scope:** All pods in all namespaces

**Use case:** Company-wide policy for all applications

```yaml
# zenquotes-egress-cluster-level.yaml
---
# ServiceEntry in istio-system with exportTo: "*" for mesh-wide visibility
apiVersion: networking.istio.io/v1
kind: ServiceEntry
metadata:
  name: zenquotes-external
  namespace: istio-system    # Root namespace
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
  exportTo:
    - "*"                    # Export to all namespaces

---
# Sidecar in istio-system = mesh-wide default
apiVersion: networking.istio.io/v1
kind: Sidecar
metadata:
  name: default-egress
  namespace: istio-system    # Root namespace = mesh-wide
  labels:
    managed-by: network-policies
spec:
  # ⬇️ NO workloadSelector = applies to ALL pods in entire mesh
  outboundTrafficPolicy:
    mode: REGISTRY_ONLY
  egress:
    - hosts:
        - "*/*"              # All internal services in any namespace
        - "istio-system/*"   # Istio control plane
        - "kube-system/*"    # DNS resolution
```

**Apply:**
```bash
kubectl apply -f zenquotes-egress-cluster-level.yaml --kubeconfig=kubeconfig-trail.yaml
```

---

## Key Differences

| Aspect | Pod-Level | Namespace-Level | Cluster-Level |
|--------|-----------|-----------------|---------------|
| `workloadSelector` | ✅ Has labels | ❌ None | ❌ None |
| Sidecar namespace | App namespace | App namespace | `istio-system` |
| ServiceEntry namespace | App namespace | App namespace | `istio-system` |
| `exportTo` on ServiceEntry | Optional | Optional | `"*"` (required) |
| Affects | Single app | All apps in NS | All apps in cluster |

---

## Testing Commands

```bash
# Verify ServiceEntry and Sidecar created
kubectl get serviceentries,sidecars -n garden --kubeconfig=kubeconfig-trail.yaml
kubectl get serviceentries,sidecars -n istio-system --kubeconfig=kubeconfig-trail.yaml

# Test allowed traffic (zenquotes.io)
kubectl exec -n garden deploy/beautiful-garden -c beautiful-garden \
  --kubeconfig=kubeconfig-trail.yaml -- \
  wget -qO- --timeout=5 https://zenquotes.io/api/random

# Test blocked traffic (any other external site)
kubectl exec -n garden deploy/beautiful-garden -c beautiful-garden \
  --kubeconfig=kubeconfig-trail.yaml -- \
  wget -qO- --timeout=5 https://httpbin.org/get 2>&1 || echo "BLOCKED ✅"
```

---

## Cleanup

```bash
# Remove pod-level
kubectl delete sidecar restrict-egress-pod -n garden --kubeconfig=kubeconfig-trail.yaml

# Remove namespace-level
kubectl delete sidecar restrict-egress-namespace -n garden --kubeconfig=kubeconfig-trail.yaml

# Remove cluster-level
kubectl delete sidecar default-egress -n istio-system --kubeconfig=kubeconfig-trail.yaml
kubectl delete serviceentry zenquotes-external -n istio-system --kubeconfig=kubeconfig-trail.yaml
```
