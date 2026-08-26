# ─────────────────────────────────────────────────────────────────────────────
# route-table.tf — Public Route Table
#
# Why 0.0.0.0/0 is required for internet access:
#   0.0.0.0/0 is the "default route" — it matches ANY destination IP that
#   doesn't match a more specific route. By pointing it at the Internet Gateway,
#   we tell the VPC router: "for all traffic going anywhere on the internet,
#   send it through the IGW." Without this route, outbound traffic would be
#   dropped (no path to the internet) even if the instance has a public IP.
#
# Route table association:
#   Linking the route table to the public subnet makes all instances in that
#   subnet use these routes automatically.
# ─────────────────────────────────────────────────────────────────────────────

# Public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  # Default route — all internet-bound traffic goes via the IGW
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name    = "${var.project}-public-route-table"
    Project = var.project
  }
}

# Associate the public route table with the public subnet
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
