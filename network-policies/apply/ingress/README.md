# Ingress Policies (Cluster-Wide)

This folder contains Istio ingress policies that restrict external access to the entire cluster.

## Scope: Cluster-Wide

The `AuthorizationPolicy` is applied to `istio-ingressgateway` in `istio-system` namespace, affecting ALL incoming traffic.

---

## Files

| File | Description |
|------|-------------|
| `istio-gateway-policy.yaml` | IP whitelist for ingress gateway |
| `README.md` | This documentation |
| `qna.md` | Q&A for learning |

---

## Current Configuration

**Allowed IPs:**
```yaml
remoteIpBlocks:
  - "163.223.48.163/32"
  - "103.99.8.235/32"
```

---

## Commands

### Apply
```bash
kubectl apply -f network-policies/apply/ingress/ --kubeconfig=kubeconfig-trail.yaml
```

### Delete
```bash
kubectl delete -f network-policies/apply/ingress/ --kubeconfig=kubeconfig-trail.yaml
```

### Verify
```bash
kubectl get authorizationpolicy -n istio-system --kubeconfig=kubeconfig-trail.yaml
```

### Find Your IP
```bash
curl ifconfig.me
```

---

## How It Works

```
Internet → Istio Ingress Gateway → AuthorizationPolicy Check → Application
                                        ↓
                              IP in whitelist? → ✅ Allow
                              IP not in list?  → ❌ Deny (403)
```

1. All external traffic enters through `istio-ingressgateway`
2. The `AuthorizationPolicy` checks the source IP (`remoteIpBlocks`)
3. Only whitelisted IPs can access any service in the cluster
4. Requires `externalTrafficPolicy: Local` on the ingress service to preserve client IP

---

## Making Changes

### Add a New IP
1. Edit `istio-gateway-policy.yaml`
2. Add your IP to `remoteIpBlocks` list
3. Apply: `kubectl apply -f network-policies/apply/ingress/ --kubeconfig=kubeconfig-trail.yaml`

### Remove an IP
1. Edit `istio-gateway-policy.yaml`
2. Remove the IP from `remoteIpBlocks` list
3. Apply the changes

### Allow All IPs (Remove Restriction)
```bash
kubectl delete -f network-policies/apply/ingress/ --kubeconfig=kubeconfig-trail.yaml
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 403 Forbidden | Your IP not in whitelist - check with `curl ifconfig.me` |
| Policy not working | Verify `externalTrafficPolicy: Local` on ingress service |
| Can't find policy | Run `kubectl get authorizationpolicy -A` |
