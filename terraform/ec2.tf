# ─────────────────────────────────────────────────────────────────────────────
# ec2.tf — Two EC2 instances
#
# Instance #1 (k3s):
#   - Will later run K3s + MERN frontend + backend
#   - t3.medium: 2 vCPU, 4 GB RAM — adequate for a dev K3s single-node cluster
#
# Instance #2 (monitoring):
#   - Will later run Docker + Prometheus + Grafana
#   - t3.medium: same size for consistency; can be downgraded to t3.small
#
# Both instances:
#   - Use the latest Canonical Ubuntu 24.04 AMI (resolved via SSM, not hard-coded)
#   - Are placed in the public subnet (auto-assigned public IPv4)
#   - Use the key pair specified in var.key_name (must already exist in AWS)
#   - Root volume: 20 GB gp3 (faster and cheaper than gp2 at the same size)
# ─────────────────────────────────────────────────────────────────────────────

# ── EC2 #1: K3s Node ─────────────────────────────────────────────────────────
resource "aws_instance" "k3s" {
  ami                    = data.aws_ami.ubuntu_24_04.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.k3s.id]
  key_name               = var.key_name

  # Disable public IP association at the instance level — the subnet already
  # handles auto-assignment via map_public_ip_on_launch = true.
  associate_public_ip_address = true

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20 # GB — increase to 30+ when K3s + Docker images are added
    delete_on_termination = true

    tags = {
      Name    = "${var.project}-k3s-root-volume"
      Project = var.project
    }
  }

  # user_data is intentionally empty — DO NOT install K3s here.
  # K3s will be installed manually in a later step.

  tags = {
    Name    = "${var.project}-k3s"
    Project = var.project
    Role    = "k3s-node"
  }
}

# ── EC2 #2: Monitoring Node ───────────────────────────────────────────────────
resource "aws_instance" "monitoring" {
  ami                    = data.aws_ami.ubuntu_24_04.id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.monitoring.id]
  key_name               = var.key_name

  associate_public_ip_address = true

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 20 # GB — increase when Prometheus TSDB grows
    delete_on_termination = true

    tags = {
      Name    = "${var.project}-monitoring-root-volume"
      Project = var.project
    }
  }

  # user_data is intentionally empty — DO NOT install Docker/Prometheus/Grafana here.
  # These will be installed manually in a later step.

  tags = {
    Name    = "${var.project}-monitoring"
    Project = var.project
    Role    = "monitoring-node"
  }
}
