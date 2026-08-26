# ─────────────────────────────────────────────────────────────────────────────
# security-groups.tf — Two separate security groups
#
# Security Group 1: ragpdf-k3s-sg       → EC2 #1 (K3s / MERN app)
# Security Group 2: ragpdf-monitoring-sg → EC2 #2 (Prometheus + Grafana)
#
# Design decisions:
#   - SSH is restricted to admin_ip_cidr (your public IP/32) NOT 0.0.0.0/0
#   - K3s API port 6443 is restricted to admin_ip_cidr only (not public)
#   - HTTP/HTTPS are open to 0.0.0.0/0 (required for the MERN app later)
#   - Grafana/Prometheus ports are open to 0.0.0.0/0 for dashboard access
#     (consider restricting to admin_ip_cidr in production)
#   - All outbound traffic is allowed (standard for app servers)
# ─────────────────────────────────────────────────────────────────────────────

# ── Security Group 1: K3s Node (EC2 #1) ─────────────────────────────────────
resource "aws_security_group" "k3s" {
  name        = "${var.project}-k3s-sg"
  description = "Security group for the K3s node running the MERN RAG application."
  vpc_id      = aws_vpc.main.id

  # ── Inbound Rules ──────────────────────────────────────────────────────────

  # SSH — restricted to your admin IP only
  # Replace var.admin_ip_cidr with YOUR_PUBLIC_IP/32 in terraform.tfvars
  ingress {
    description = "SSH access from admin IP only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_ip_cidr]
  }

  # HTTP — public access required for the MERN frontend/backend later
  ingress {
    description = "HTTP - public web access for MERN app"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTPS — public access for TLS termination later
  ingress {
    description = "HTTPS - public TLS access for MERN app"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # K3s API Server — port 6443
  # Restricted to admin IP only. EC2 #2 (monitoring) does NOT need K3s API
  # access at this stage — Prometheus will scrape app metrics via HTTP, not
  # the K3s API. This port is only needed for local kubectl access.
  ingress {
    description = "K3s API server - admin kubectl access only"
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = [var.admin_ip_cidr]
  }

  # ── Outbound Rules ─────────────────────────────────────────────────────────
  # Allow all outbound (required for: apt updates, Docker Hub pulls, MongoDB Atlas)
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project}-k3s-sg"
    Project = var.project
  }
}

# ── Security Group 2: Monitoring Node (EC2 #2) ───────────────────────────────
resource "aws_security_group" "monitoring" {
  name        = "${var.project}-monitoring-sg"
  description = "Security group for the monitoring node running Prometheus and Grafana."
  vpc_id      = aws_vpc.main.id

  # ── Inbound Rules ──────────────────────────────────────────────────────────

  # SSH — restricted to admin IP only
  ingress {
    description = "SSH access from admin IP only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.admin_ip_cidr]
  }

  # Grafana — port 3000
  # Opened to 0.0.0.0/0 so the Grafana dashboard is accessible from a browser.
  # Consider restricting to admin_ip_cidr once dashboards are set up.
  ingress {
    description = "Grafana dashboard - browser access"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Prometheus — port 9090
  # Opened to 0.0.0.0/0 so the Prometheus UI is accessible from a browser.
  # In production, restrict to admin_ip_cidr or use a VPN.
  ingress {
    description = "Prometheus UI - browser access"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # ── Outbound Rules ─────────────────────────────────────────────────────────
  # Allow all outbound (required for: apt updates, Docker Hub pulls, scraping K3s metrics)
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name    = "${var.project}-monitoring-sg"
    Project = var.project
  }
}
