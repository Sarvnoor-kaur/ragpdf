# ─────────────────────────────────────────────────────────────────────────────
# outputs.tf — Useful values printed after terraform apply
#
# Use these values to:
#   - SSH into the EC2 instances
#   - Configure kubectl for K3s
#   - Set up Prometheus scrape targets
#   - Reference IDs in future Terraform steps
# ─────────────────────────────────────────────────────────────────────────────

# ── Networking ───────────────────────────────────────────────────────────────
output "vpc_id" {
  description = "ID of the ragpdf VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.public.id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "public_route_table_id" {
  description = "ID of the public route table"
  value       = aws_route_table.public.id
}

# ── Security Groups ───────────────────────────────────────────────────────────
output "k3s_security_group_id" {
  description = "Security group ID for the K3s node"
  value       = aws_security_group.k3s.id
}

output "monitoring_security_group_id" {
  description = "Security group ID for the monitoring node"
  value       = aws_security_group.monitoring.id
}

# ── EC2 #1: K3s Node ─────────────────────────────────────────────────────────
output "k3s_instance_id" {
  description = "EC2 instance ID of the K3s node"
  value       = aws_instance.k3s.id
}

output "k3s_public_ip" {
  description = "Public IP of the K3s node — use for SSH and kubectl"
  value       = aws_instance.k3s.public_ip
}

output "k3s_private_ip" {
  description = "Private IP of the K3s node — use for internal VPC communication"
  value       = aws_instance.k3s.private_ip
}

output "k3s_public_dns" {
  description = "Public DNS hostname of the K3s node"
  value       = aws_instance.k3s.public_dns
}

output "k3s_ssh_command" {
  description = "Ready-to-use SSH command for the K3s node"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ubuntu@${aws_instance.k3s.public_ip}"
}

# ── EC2 #2: Monitoring Node ───────────────────────────────────────────────────
output "monitoring_instance_id" {
  description = "EC2 instance ID of the monitoring node"
  value       = aws_instance.monitoring.id
}

output "monitoring_public_ip" {
  description = "Public IP of the monitoring node — use for SSH, Grafana, Prometheus"
  value       = aws_instance.monitoring.public_ip
}

output "monitoring_private_ip" {
  description = "Private IP of the monitoring node"
  value       = aws_instance.monitoring.private_ip
}

output "monitoring_public_dns" {
  description = "Public DNS hostname of the monitoring node"
  value       = aws_instance.monitoring.public_dns
}

output "monitoring_ssh_command" {
  description = "Ready-to-use SSH command for the monitoring node"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ubuntu@${aws_instance.monitoring.public_ip}"
}

output "grafana_url" {
  description = "Grafana URL (available after Docker + Grafana are installed in a later step)"
  value       = "http://${aws_instance.monitoring.public_ip}:3000"
}

output "prometheus_url" {
  description = "Prometheus URL (available after Docker + Prometheus are installed in a later step)"
  value       = "http://${aws_instance.monitoring.public_ip}:9090"
}

# ── Resolved AMI ─────────────────────────────────────────────────────────────
output "ubuntu_ami_id" {
  description = "Ubuntu 24.04 LTS AMI ID resolved from AWS SSM (ap-south-1)"
  value       = data.aws_ami.ubuntu_24_04.id
}
