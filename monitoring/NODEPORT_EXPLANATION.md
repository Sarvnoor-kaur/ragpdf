# 🔌 NodePort Explanation - Simple Hindi/English

## ❓ NodePort Kya Hai?

**NodePort** ek Kubernetes service type hai jo pod ko **EC2 ke public IP + specific port** pe expose karta hai.

### 🎯 Types of K8s Services:

1. **ClusterIP** (Default)
   - Sirf cluster ke andar accessible
   - Bahar se direct access NAHI
   - Your app uses this ✅

2. **NodePort** 
   - Cluster ke andar + bahar se accessible
   - EC2_IP:NodePort se access kar sakte ho
   - Monitoring uses this ✅

3. **LoadBalancer**
   - AWS Load Balancer create karta hai
   - Production ke liye best
   - Aap use nahi kar rahe

---

## 🔍 Aapke Project Mein NodePort

### ✅ Kaha Hai NodePort?

**Sirf 1 jagah:**

```yaml
File: monitoring/k8s/kube-state-metrics.yaml

Service:
  name: kube-state-metrics
  namespace: kube-system
  type: NodePort          ⬅️ YEH HAI NODEPORT
  ports:
    - port: 8080          # Cluster ke andar
      nodePort: 30001     ⬅️ EC2 pe ye port khulega
```

**Access:**
```
http://YOUR_EC2_IP:30001/metrics
```

---

## 🚫 NodePort NAHI Hai Yaha:

### Application Services (ClusterIP Use Hota Hai):

#### 1. Frontend Service
```yaml
File: company-policy-ai/k8s/frontend-service.yaml

Service:
  name: ragpdf-frontend-svc
  namespace: ragpdf
  type: ClusterIP         ⬅️ NOT NodePort
  ports:
    - port: 80
      targetPort: 80
```

**Access:** Ingress ke through (Port 80)

#### 2. Backend Service
```yaml
File: company-policy-ai/k8s/backend-service.yaml

Service:
  name: ragpdf-backend-svc
  namespace: ragpdf
  type: ClusterIP         ⬅️ NOT NodePort
  ports:
    - port: 5001
      targetPort: 5001
```

**Access:** Ingress ke through (Port 80 → /api)

---

## 🌐 Application Access Flow (Without NodePort)

```
User
  │
  ▼
http://EC2_IP:80  (Traefik Ingress on EC2)
  │
  ├─ /        → Frontend Service (ClusterIP:80)  → Frontend Pod
  │
  └─ /api/*   → Backend Service (ClusterIP:5001) → Backend Pod
```

**Kyun ClusterIP?**
- More secure (internal only)
- Ingress handles routing
- Production best practice
- Single entry point (port 80/443)

---

## 📊 Monitoring Access Flow (With NodePort)

```
Prometheus (Windows localhost:9090)
  │
  ├─ Scrapes: http://EC2_IP:9100  (Node Exporter - host port)
  │                                 
  └─ Scrapes: http://EC2_IP:30001 (Kube-State-Metrics - NodePort) ⬅️
                                    
Grafana (Windows localhost:3000)
  │
  └─ Queries: Prometheus
```

**Kyun NodePort?**
- Prometheus bahar se (Windows) scrape karta hai
- Direct access chahiye
- Ingress use nahi kar sakte monitoring ke liye

---

## 🔒 Security - Ports Kon Access Kar Sakta Hai?

### AWS Security Group Rules:

| Port | Service | Allowed From | Purpose |
|------|---------|--------------|---------|
| 80 | Ingress | `0.0.0.0/0` | Everyone can access app |
| 443 | Ingress | `0.0.0.0/0` | Everyone (HTTPS) |
| 9100 | Node Exporter | `admin_ip_cidr` | Only you (monitoring) |
| 30001 | Kube-State (NodePort) | `admin_ip_cidr` | Only you (monitoring) |
| 6443 | K3s API | `admin_ip_cidr` | Only you (kubectl) |

**`admin_ip_cidr` = Your Windows machine IP**

File: `terraform/security-groups.tf`

---

## 🎯 Quick Reference

### Check Services on K3s:

```bash
# SSH to EC2
ssh -i ~/.ssh/shophub-key.pem ubuntu@YOUR_EC2_IP

# List all services
kubectl get svc -A

# Expected Output:
NAMESPACE     NAME                     TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)
ragpdf        ragpdf-frontend-svc      ClusterIP   10.43.xxx.xxx   <none>        80/TCP
ragpdf        ragpdf-backend-svc       ClusterIP   10.43.xxx.xxx   <none>        5001/TCP
kube-system   kube-state-metrics       NodePort    10.43.xxx.xxx   <none>        8080:30001/TCP ⬅️
```

### Access URLs:

```bash
# Application (via Ingress)
curl http://YOUR_EC2_IP/
curl http://YOUR_EC2_IP/api/health

# Node Exporter (direct port)
curl http://YOUR_EC2_IP:9100/metrics

# Kube-State-Metrics (NodePort)
curl http://YOUR_EC2_IP:30001/metrics
```

---

## 📝 Summary Table

| Component | K8s Service Type | Deployed Where | External Port | Access Method |
|-----------|------------------|----------------|---------------|---------------|
| **Frontend** | ClusterIP | EC2 K3s (ragpdf ns) | 80 | Via Ingress |
| **Backend** | ClusterIP | EC2 K3s (ragpdf ns) | 80 (/api) | Via Ingress |
| **Node Exporter** | N/A (Systemd) | EC2 Host | 9100 | Direct port |
| **Kube-State-Metrics** | **NodePort** | EC2 K3s (kube-system) | **30001** | Direct **NodePort** |
| **Prometheus** | Docker | Windows | localhost:9090 | Docker port |
| **Grafana** | Docker | Windows | localhost:3000 | Docker port |

---

## ✅ Final Answer

### Aapke Sawaal Ka Jawab:

**1. NodePort kaha pe hai?**
```
File: monitoring/k8s/kube-state-metrics.yaml
Service: kube-state-metrics
Namespace: kube-system
NodePort: 30001
```

**2. Deploy kidhar hai?**
```
EC2 K3s cluster (kube-system namespace)
```

**3. Kis IP pe accessible?**
```
http://YOUR_EC2_PUBLIC_IP:30001/metrics
```

**Application ka NodePort?**
```
NAHI hai! Application ClusterIP + Ingress use karta hai.
External access: http://EC2_IP:80 (via Ingress)
```

---

**🎉 Ab clear hai? Sirf kube-state-metrics mein NodePort 30001 hai, application services mein nahi!**
