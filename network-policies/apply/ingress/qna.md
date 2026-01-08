# Ingress Policy Q&A

Questions from novice to advanced level about Istio ingress policies.

---

## 🟢 Novice Level

### Q1: What is an ingress policy?
**A:** An ingress policy controls **incoming traffic** to your cluster. It decides who can access your services from outside.

### Q2: What is an AuthorizationPolicy?
**A:** An Istio resource that defines access control rules. It can allow/deny traffic based on source IP, headers, JWT claims, etc.

### Q3: Why do we need IP whitelisting?
**A:** To restrict access to only trusted sources. For example, only your office IP or VPN can access the cluster.

### Q4: What happens if my IP is not in the whitelist?
**A:** You get a **403 Forbidden** response. The ingress gateway blocks your request before it reaches any service.

### Q5: Where is the policy applied?
**A:** To `istio-ingressgateway` in `istio-system` namespace. This is the entry point for all external traffic.

---

## 🟡 Intermediate Level

### Q6: What is `remoteIpBlocks` vs `ipBlocks`?
**A:** 
- `remoteIpBlocks` - Original client IP (requires `externalTrafficPolicy: Local`)
- `ipBlocks` - IP seen by the sidecar (may be load balancer IP)

### Q7: Why does `externalTrafficPolicy: Local` matter?
**A:** By default, Kubernetes SNAT's client IPs. With `Local`, the original client IP is preserved so the policy can check it correctly.

### Q8: Can I use CIDR ranges instead of individual IPs?
**A:** Yes! Examples:
```yaml
remoteIpBlocks:
  - "192.168.1.0/24"     # Entire subnet
  - "10.0.0.0/8"          # Large private range
  - "0.0.0.0/0"           # All IPs (allow all)
```

### Q9: How do I allow multiple IPs?
**A:** Add them as a list:
```yaml
remoteIpBlocks:
  - "1.2.3.4/32"
  - "5.6.7.8/32"
  - "9.10.11.0/24"
```

### Q10: Can I restrict by HTTP headers or paths?
**A:** Yes! Example to allow only specific path:
```yaml
rules:
  - from:
      - source:
          remoteIpBlocks: ["1.2.3.4/32"]
    to:
      - operation:
          paths: ["/api/*"]
```

---

## 🔴 Advanced / PR Level

### Q11: What's the difference between ALLOW and DENY actions?
**A:**
- `ALLOW` - Explicitly permit matching requests
- `DENY` - Explicitly block matching requests
- `CUSTOM` - Delegate to external authorization

**Evaluation order:** CUSTOM → DENY → ALLOW → Default (allow/deny based on mesh config)

### Q12: How do multiple AuthorizationPolicies interact?
**A:**
1. If ANY `DENY` policy matches → Request denied
2. If NO `ALLOW` policies exist → Request allowed
3. If `ALLOW` policies exist → Must match at least one

### Q13: What is the `selector` field for?
**A:** It targets specific workloads:
```yaml
selector:
  matchLabels:
    app: istio-ingressgateway  # Only apply to this workload
```
Without selector, policy applies to ALL workloads in the namespace.

### Q14: How can I debug authorization issues?
**A:**
```bash
# Check Envoy config
istioctl proxy-config listener <pod-name> -n <namespace>

# Enable debug logging
kubectl exec <pod> -c istio-proxy -- curl -X POST localhost:15000/logging?rbac=debug

# Check access logs
kubectl logs <pod> -c istio-proxy | grep -i rbac
```

### Q15: What's the performance impact of AuthorizationPolicy?
**A:** Minimal. Policies are compiled into Envoy's RBAC filter and evaluated in-line. However:
- Many complex rules may increase latency slightly
- JWT validation adds more overhead than IP checks
- Use specific selectors to limit scope

### Q16: Can I use external authorization (OPA, custom authz)?
**A:** Yes, with `CUSTOM` action:
```yaml
apiVersion: security.istio.io/v1
kind: AuthorizationPolicy
spec:
  action: CUSTOM
  provider:
    name: my-opa
  rules:
    - {}
```
Requires `meshConfig.extensionProviders` configuration.

### Q17: How do I migrate from Kubernetes NetworkPolicy to Istio AuthorizationPolicy?
**A:**
| K8s NetworkPolicy | Istio AuthorizationPolicy |
|-------------------|---------------------------|
| L3/L4 only (IP, port) | L7 (headers, paths, JWT) |
| `ingress` block | `from` field |
| `egress` block | Use Sidecar resource |
| `ipBlock.cidr` | `remoteIpBlocks` |

### Q18: What are common PR review points for ingress policies?
**A:**
- ✅ Is the policy cluster-wide or namespace-scoped? (intentional?)
- ✅ Are CIDR ranges correct? (`/32` for single IP)
- ✅ Is `externalTrafficPolicy: Local` set?
- ✅ Are there conflicting DENY policies?
- ✅ Is the selector matching the right workload?
- ✅ Are sensitive paths protected?
- ✅ Is there a default deny policy as baseline?
