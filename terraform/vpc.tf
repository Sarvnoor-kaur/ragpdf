# ─────────────────────────────────────────────────────────────────────────────
# vpc.tf — Virtual Private Cloud
#
# A VPC is an isolated private network inside AWS.
# 10.0.0.0/16 provides 65,536 IP addresses (10.0.0.0 – 10.0.255.255).
# All subnets, EC2 instances, and other resources live inside this VPC.
#
# DNS support  → allows EC2 instances to resolve AWS internal hostnames
# DNS hostnames → assigns public DNS hostnames to instances with public IPs
#                 (required for SSH access via hostname and for K3s node discovery)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name    = "${var.project}-vpc"
    Project = var.project
  }
}
