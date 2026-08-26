# ─────────────────────────────────────────────────────────────────────────────
# AWS Provider
#
# Credentials are intentionally NOT set here.
# Terraform automatically uses the credentials configured by `aws configure`
# (stored in ~/.aws/credentials and ~/.aws/config on the local machine).
#
# Never hard-code access_key or secret_key in Terraform files.
# ─────────────────────────────────────────────────────────────────────────────
provider "aws" {
  region = var.aws_region
}
