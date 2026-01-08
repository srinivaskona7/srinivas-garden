# Egress Policy Q&A

Questions from novice to advanced level about Istio egress policies.

---

## 🟢 Novice Level

### Q1: What is an egress policy?
**A:** An egress policy controls **outgoing traffic** from your pods. It decides which external services your applications can access.

### Q2: What is a ServiceEntry?
**A:** An Istio resource that registers external services (outside the mesh) so Istio knows about them. Without it, external URLs are "unknown".

### Q3: What is a Sidecar resource?
**A:** An Istio resource that configures the Envoy proxy sidecar. It can restrict which services a pod can talk to.

### Q4: What does `REGISTRY_ONLY` mean?
**A:** Only allow traffic to services registered in Istio's service registry (internal services + ServiceEntries). Block everything else.

### Q5: What does `ALLOW_ANY` mean?
**A:** Allow traffic to any destination, even if Istio doesn't know about it. This is the default (no restriction).

---

## 🟡 Intermediate Level

### Q6: What's the difference between ServiceEntry and Sidecar?
**A:**
| Resource | Purpose |
|----------|---------|
| ServiceEntry | Registers external URLs as "known" |
| Sidecar | Configures what traffic the proxy allows |

Both work together: Sidecar blocks unknown traffic, ServiceEntry makes external URLs "known".

### Q7: Why use `*/*` in egress hosts?
**A:** `*/*` is a wildcard meaning "all services in all namespaces". It allows all internal cluster traffic. Format is `<namespace>/<service>`.

### Q8: How do I allow multiple external domains?
**A:** Create multiple ServiceEntries:
```yaml
---
apiVersion: networking.istio.io/v1
kind: ServiceEntry
metadata:
  name: api1-external
spec:
  hosts:
    - api1.example.com
---
apiVersion: networking.istio.io/v1
kind: ServiceEntry
metadata:
  name: api2-external
spec:
  hosts:
    - api2.example.com
```

### Q9: Can I use wildcards in ServiceEntry hosts?
**A:** Yes!
```yaml
hosts:
  - "*.googleapis.com"  # All Google APIs
  - "*.s3.amazonaws.com"  # All S3 buckets
```

### Q10: What happens when egress is blocked?
**A:** The request fails with:
- HTTP: 502 Bad Gateway or 503 Service Unavailable
- TCP: Connection reset or timeout

---

## 🔴 Advanced / PR Level

### Q11: What's the scope of Sidecar resources?
**A:**
| Namespace | workloadSelector | Scope |
|-----------|------------------|-------|
| istio-system | None | Cluster-wide (root config) |
| istio-system | Present | Specific workloads only |
| app-namespace | None | All workloads in that namespace |
| app-namespace | Present | Specific workloads in namespace |

**Priority:** Workload-specific > Namespace > Cluster-wide

### Q12: What is `exportTo` in ServiceEntry?
**A:** Controls which namespaces can see the ServiceEntry:
```yaml
exportTo:
  - "*"           # All namespaces (cluster-wide)
  - "."           # Only current namespace
  - "garden"      # Only 'garden' namespace
  - "garden,prod" # Multiple namespaces
```

### Q13: What is `resolution` in ServiceEntry?
**A:**
| Value | Meaning |
|-------|---------|
| `DNS` | Resolve hostname via DNS |
| `STATIC` | Use IP addresses from `endpoints` |
| `NONE` | Passthrough, no resolution |
| `DNS_ROUND_ROBIN` | Round-robin across DNS results |

### Q14: How do I debug egress issues?
**A:**
```bash
# Check if destination is in Envoy's cluster config
istioctl proxy-config cluster <pod-name> -n <namespace> | grep <destination>

# Check outbound listeners
istioctl proxy-config listener <pod-name> --port 443

# Enable access logging
kubectl logs <pod> -c istio-proxy | grep "outbound"

# Test from inside pod
kubectl exec -it <pod> -- curl -v https://example.com
```

### Q15: Why is my ServiceEntry not working?
**A:** Common issues:
1. Wrong `namespace` - ServiceEntry must be in namespace that can see it
2. Missing `exportTo: "*"` for cluster-wide access
3. Wrong `port.protocol` - HTTPS vs TLS vs TCP
4. DNS not resolving - check `resolution: DNS`
5. Sidecar not referencing the ServiceEntry's namespace

### Q16: What's the difference between egress gateway and Sidecar egress?
**A:**
| Feature | Sidecar Egress | Egress Gateway |
|---------|----------------|----------------|
| Where | Each pod's sidecar | Dedicated gateway pod |
| Visibility | Per-pod control | Centralized |
| Monitoring | Harder | Easier (single point) |
| Security | Source IP is pod | Source IP is gateway |
| Use case | Simple restriction | Auditing, security, NAT |

### Q17: Can I apply different egress rules per namespace?
**A:** Yes! Create namespace-scoped Sidecar:
```yaml
apiVersion: networking.istio.io/v1
kind: Sidecar
metadata:
  name: restrict-egress
  namespace: production  # Only affects this namespace
spec:
  outboundTrafficPolicy:
    mode: REGISTRY_ONLY
  egress:
    - hosts:
        - "production/*"
        - "istio-system/*"
```

### Q18: What are common PR review points for egress policies?
**A:**
- ✅ Is `outboundTrafficPolicy: REGISTRY_ONLY` intentional?
- ✅ Are all required external URLs in ServiceEntries?
- ✅ Is `exportTo` set correctly? (avoid `*` if not needed)
- ✅ Are internal namespaces like `kube-system` accessible?
- ✅ Is DNS resolution working? (check ports)
- ✅ Are there conflicting Sidecar resources?
- ✅ Performance: Avoid overly broad `*/*` if possible
- ✅ Security: Are you allowing more than necessary?

### Q19: How do I handle TLS origination?
**A:** For HTTP to HTTPS upgrade:
```yaml
apiVersion: networking.istio.io/v1
kind: ServiceEntry
metadata:
  name: external-api
spec:
  hosts:
    - api.example.com
  ports:
    - number: 443
      name: https
      protocol: TLS  # Not HTTPS
  resolution: DNS
---
apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: external-api
spec:
  host: api.example.com
  trafficPolicy:
    tls:
      mode: SIMPLE  # Originate TLS
```

### Q20: What's the default egress behavior without any policies?
**A:** Depends on mesh config:
```yaml
# In istio configmap
meshConfig:
  outboundTrafficPolicy:
    mode: ALLOW_ANY  # Default - allows all egress
    # mode: REGISTRY_ONLY  # Blocks unknown destinations
```

Check with: `kubectl get configmap istio -n istio-system -o yaml | grep outboundTrafficPolicy`
