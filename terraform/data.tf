# ─────────────────────────────────────────────────────────────────────────────
# data.tf — Dynamic data sources
# ─────────────────────────────────────────────────────────────────────────────

# Fetch the latest Ubuntu 24.04 LTS AMI for amd64 in the configured region.
# This filters the public AMIs owned by Canonical.
data "aws_ami" "ubuntu_24_04" {
  most_recent = true
  owners      = ["099720109477"] # Canonical's official AWS account ID

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

