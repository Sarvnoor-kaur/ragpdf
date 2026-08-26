# ─────────────────────────────────────────────────────────────────────────────
# variables.tf — All input variables for the ragpdf AWS infrastructure
# ─────────────────────────────────────────────────────────────────────────────

# ── AWS Region ──────────────────────────────────────────────────────────────
variable "aws_region" {
  description = "AWS region where all resources will be created."
  type        = string
  default     = "ap-south-1"
}

# ── VPC ─────────────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC. /16 gives 65,536 IP addresses."
  type        = string
  default     = "10.0.0.0/16"
}

# ── Public Subnet ────────────────────────────────────────────────────────────
variable "public_subnet_cidr" {
  description = <<-EOT
    CIDR block for the public subnet.
    10.0.1.0/24 is a valid /24 slice inside 10.0.0.0/16:
      - VPC covers   10.0.0.0  – 10.0.255.255
      - Subnet covers 10.0.1.0 – 10.0.1.255  (256 IPs, no overlap with VPC boundary)
  EOT
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  description = "Availability Zone for the public subnet."
  type        = string
  default     = "ap-south-1a"
}

# ── EC2 ─────────────────────────────────────────────────────────────────────
variable "instance_type" {
  description = <<-EOT
    EC2 instance type for both nodes.
    t3.medium (2 vCPU, 4 GB RAM) is suitable for a dev/lab K3s node.
    Upgrade to t3.large or m5.large for production workloads.
  EOT
  type        = string
  default     = "t3.medium"
}

variable "key_name" {
  description = <<-EOT
    Name of an existing EC2 Key Pair in the ap-south-1 region.
    Create one in the AWS Console under EC2 → Key Pairs → Create key pair,
    then set this variable to the name you chose.
    NEVER store the .pem private key file in this Terraform directory.
  EOT
  type        = string
  # No default — must be supplied in terraform.tfvars
}

# ── Security ─────────────────────────────────────────────────────────────────
variable "admin_ip_cidr" {
  description = <<-EOT
    Your public IP address in CIDR notation used to restrict SSH access.
    Replace with YOUR_PUBLIC_IP/32, e.g. 203.0.113.10/32
    Find your public IP at: https://checkip.amazonaws.com
    DO NOT leave as 0.0.0.0/0 in production — that exposes SSH to the entire internet.
  EOT
  type    = string
  default = "0.0.0.0/0" # Replace with your actual IP/32 before applying
}

# ── Project Metadata ─────────────────────────────────────────────────────────
variable "project" {
  description = "Project name used in Name tags across all resources."
  type        = string
  default     = "ragpdf"
}
