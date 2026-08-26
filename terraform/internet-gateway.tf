# ─────────────────────────────────────────────────────────────────────────────
# internet-gateway.tf — Internet Gateway
#
# An Internet Gateway (IGW) is the single point that connects the VPC to the
# public internet. Without it, no instance in the VPC can send or receive
# traffic from the internet, regardless of whether it has a public IP.
#
# Architecture:
#   Internet
#      ↓
#   Internet Gateway  (this resource)
#      ↓
#   VPC (ragpdf-vpc)
#      ↓
#   Public Subnet → EC2 #1 (K3s) + EC2 #2 (Monitoring)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name    = "${var.project}-igw"
    Project = var.project
  }
}
