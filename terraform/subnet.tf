# ─────────────────────────────────────────────────────────────────────────────
# subnet.tf — Public Subnet
#
# Why 10.0.1.0/24 is valid inside 10.0.0.0/16:
#   VPC covers:    10.0.0.0  – 10.0.255.255  (/16 = 65,536 addresses)
#   Subnet covers: 10.0.1.0  – 10.0.1.255    (/24 = 256 addresses)
#   10.0.1.x is entirely within 10.0.0.0/16 → no overlap, completely valid.
#
# map_public_ip_on_launch = true:
#   Every EC2 instance launched into this subnet automatically receives a
#   public IPv4 address. This is required so both instances are reachable
#   from the internet (SSH, app ports) without an Elastic IP.
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name    = "${var.project}-public-subnet"
    Project = var.project
  }
}
