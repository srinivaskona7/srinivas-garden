# Egress Policies (Cluster-Wide)

This folder contains Istio egress policies that restrict outbound traffic for ALL pods in the mesh.

## Scope: Cluster-Wide

Policies are applied to `istio-system` namespace without `workloadSelector`, affecting ALL workloads.

---

## Files

| File | Description |
|------|-------------|
| `zenquotes-egress.yaml` | ServiceEntry + Sidecar (cluster-wide) |
| `README.md` | This documentation |
| `qna.md` | Q&A for learning |

---

## Current Configuration

**Allowed Outbound:**
```yaml
egress:
  - hosts:
      - "*/*"  # All internal services (all namespaces)

# Plus ServiceEntry for external:
hosts:
  - zenquotes.io  # Allowed external API
```

**Blocked:**
- ❌ All external traffic except `zenquotes.io`

---

## Commands

### Apply
```bash
kubectl apply -f network-policies/apply/egress/ --kubeconfig=kubeconfig-trail.yaml
```

### Delete
```bash
kubectl delete -f network-policies/apply/egress/ --kubeconfig=kubeconfig-trail.yaml
```

### Verify
```bash
# Check Sidecar
kubectl get sidecar -n istio-system --kubeconfig=kubeconfig-trail.yaml

# Check ServiceEntry
kubectl get serviceentry -n istio-system --kubeconfig=kubeconfig-trail.yaml
```

### Test Egress
```bash
# From inside a pod in the mesh:
# Should work:
curl https://zenquotes.io/api/random

# Should be blocked:
curl https://google.com
```

---

## How It Works

```
Pod → Envoy Sidecar → Egress Check → Destination
                          ↓
              Is destination in registry?
                    ↓           ↓
                   YES         NO
                    ↓           ↓
               ✅ Allow    ❌ Block (502/503)
```

1. **Sidecar** with `outboundTrafficPolicy: REGISTRY_ONLY` blocks unknown destinations
2. **ServiceEntry** registers `zenquotes.io` as a known external service
3. `*/*` allows all internal cluster traffic
4. Any external URL not registered is blocked

---

## Making Changes

### Add a New External URL
1. Add a new ServiceEntry to `zenquotes-egress.yaml`:
```yaml
---
apiVersion: networking.istio.io/v1
kind: ServiceEntry
metadata:
  name: google-external
  namespace: istio-system
spec:
  hosts:
    - "*.google.com"
  ports:
    - number: 443
      name: https
      protocol: HTTPS
  location: MESH_EXTERNAL
  resolution: DNS
  exportTo:
    - "*"
```
2. Apply: `kubectl apply -f network-policies/apply/egress/`

### Remove Egress Restriction (Allow All)
```bash
kubectl delete sidecar cluster-egress-policy -n istio-system --kubeconfig=kubeconfig-trail.yaml
```

### Block a Specific Internal Namespace
Change `*/*` to explicit list:
```yaml
egress:
  - hosts:
      - "garden/*"
      - "istio-system/*"
      # NOT including "sensitive-namespace/*"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 502/503 on external URL | URL not in ServiceEntry - add it |
| Internal service not reachable | Check if `*/*` is in egress hosts |
| DNS resolution fails | Ensure `kube-system` is allowed (covered by `*/*`) |
| Policy not applying | Check Sidecar exists: `kubectl get sidecar -A` |
