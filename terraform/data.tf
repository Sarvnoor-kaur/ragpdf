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




#data: Tells Terraform that we want to read existing information from AWS.
#data fetches information about existing infrastructure or resources.

#most_recent =This tells Terraform to select the most recently created AMI among the matching AMIs.

#Filters are conditions used in Terraform to search and select specific AWS resources based on their properties or requirements.
