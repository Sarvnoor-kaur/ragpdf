# AWS Setup Complete Guide - New Account Configuration

**Project:** RAGPDF - Complete Infrastructure Setup  
**Scenario:** Setting up with friend's AWS account  
**Goal:** Terraform + EC2 + Jenkins + K3s deployment

---

## 📋 Prerequisites Checklist

- [ ] Friend's AWS account credentials
- [ ] AWS account must have billing enabled
- [ ] Credit card added to AWS account
- [ ] Email access for verification
- [ ] Your local machine ready (Windows)

---

## Part 1: AWS Account Setup (Friend's Account)

### Step 1.1: Login to AWS Console

1. **Go to:** https://aws.amazon.com/console/
2. **Login with:**
   - Account ID or Email
   - Password
3. **Enable MFA** (Recommended for security)

### Step 1.2: Create IAM User for Yourself

⚠️ **Never use root account for daily work**

1. **Go to IAM Console:**
   ```
   https://console.aws.amazon.com/iam/
   ```

2. **Create New IAM User:**
   - Click **"Users"** → **"Create user"**
   - Username: `ragpdf-admin` (or your name)
   - ✅ Check: **"Provide user access to AWS Management Console"**
   - Choose: **"I want to create an IAM user"**
   - ✅ Check: **"Custom password"**
   - Set strong password
   - ✅ **Uncheck** "User must create new password at next sign-in"

3. **Attach Policies (Permissions):**
   
   Click **"Attach policies directly"** and select:
   - ✅ `AdministratorAccess` (Full access - for setup)
   
   OR for better security, select these specific policies:
   - ✅ `AmazonEC2FullAccess`
   - ✅ `AmazonVPCFullAccess`
   - ✅ `IAMFullAccess`
   - ✅ `AmazonS3FullAccess` (for Terraform state)

4. **Review and Create:**
   - Click **"Create user"**
   - **Save login URL** (it will look like: `https://123456789012.signin.aws.amazon.com/console`)
   - **Save credentials safely**

### Step 1.3: Create Access Keys for Terraform

1. **Click on the user** you just created (`ragpdf-admin`)

2. **Go to "Security credentials" tab**

3. **Create Access Key:**
   - Scroll to **"Access keys"** section
   - Click **"Create access key"**
   - Use case: Select **"Command Line Interface (CLI)"**
   - ✅ Check: "I understand the above recommendation..."
   - Click **"Next"**
   - Description: `Terraform and CLI access`
   - Click **"Create access key"**

4. **⚠️ IMPORTANT - Download and Save:**
   ```
   Access Key ID: AKIAIOSFODNN7EXAMPLE
   Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
   ```
   
   📝 **Save these in a secure file immediately!**
   - You can only see Secret Key once
   - Keep it confidential
   - Never commit to Git

---

## Part 2: Configure AWS CLI on Your Machine

### Step 2.1: Install AWS CLI (if not installed)

**Check if installed:**
```powershell
aws --version
```

**If not installed:**
```powershell
# Download AWS CLI v2 for Windows
# Go to: https://awscli.amazonaws.com/AWSCLIV2.msi
# Install the MSI file
# Restart PowerShell after installation
```

### Step 2.2: Configure AWS CLI

```powershell
aws configure
```

**Enter your credentials:**
```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: ap-south-1
Default output format [None]: json
```

**Verify configuration:**
```powershell
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "AIDAI...",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/ragpdf-admin"
}
```

### Step 2.3: Test AWS Access

```powershell
# List S3 buckets
aws s3 ls

# List EC2 instances
aws ec2 describe-instances --region ap-south-1

# Check available regions
aws ec2 describe-regions --output table
```

---

## Part 3: Terraform Setup for EC2

### Step 3.1: Check/Update Terraform Configuration

**Navigate to your Terraform directory:**
```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\terraform
```

### Step 3.2: Create/Update Terraform Files

**File: `provider.tf`**
```hcl
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Optional: Remote state in S3 (recommended for team work)
  # backend "s3" {
  #   bucket = "ragpdf-terraform-state"
  #   key    = "ragpdf/terraform.tfstate"
  #   region = "ap-south-1"
  # }
}

provider "aws" {
  region = var.aws_region
  
  # AWS CLI credentials will be used automatically
  # No need to hardcode access keys here
}
```

**File: `variables.tf`**
```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"  # Mumbai region
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"  # Good for K3s
}

variable "ami_id" {
  description = "Ubuntu 22.04 LTS AMI"
  type        = string
  default     = "ami-0dee22c13ea7a9a67"  # Ubuntu 22.04 in ap-south-1
}

variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "ragpdf-key"
}

variable "instance_name" {
  description = "Name tag for EC2 instance"
  type        = string
  default     = "ragpdf-k3s-server"
}
```

**File: `main.tf`**
```hcl
# Security Group
resource "aws_security_group" "ragpdf_sg" {
  name        = "ragpdf-k3s-sg"
  description = "Security group for RAGPDF K3s server"
  
  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }
  
  # HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTP"
  }
  
  # HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS"
  }
  
  # K3s API
  ingress {
    from_port   = 6443
    to_port     = 6443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "K3s API"
  }
  
  # Custom app port (if needed)
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "App port"
  }
  
  # All outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound"
  }
  
  tags = {
    Name = "ragpdf-k3s-sg"
    Project = "RAGPDF"
  }
}

# EC2 Instance
resource "aws_instance" "ragpdf_server" {
  ami           = var.ami_id
  instance_type = var.instance_type
  key_name      = var.key_name
  
  vpc_security_group_ids = [aws_security_group.ragpdf_sg.id]
  
  root_block_device {
    volume_size = 30  # GB
    volume_type = "gp3"
    encrypted   = true
  }
  
  user_data = <<-EOF
              #!/bin/bash
              apt-get update
              apt-get install -y curl wget git
              
              # Install Docker
              curl -fsSL https://get.docker.com -o get-docker.sh
              sh get-docker.sh
              usermod -aG docker ubuntu
              
              # Install K3s
              curl -sfL https://get.k3s.io | sh -
              
              # Make kubeconfig accessible
              mkdir -p /home/ubuntu/.kube
              cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
              chown -R ubuntu:ubuntu /home/ubuntu/.kube
              
              echo "Setup complete!" > /home/ubuntu/setup-complete.txt
              EOF
  
  tags = {
    Name    = var.instance_name
    Project = "RAGPDF"
    Environment = "Production"
  }
}

# Elastic IP
resource "aws_eip" "ragpdf_eip" {
  instance = aws_instance.ragpdf_server.id
  domain   = "vpc"
  
  tags = {
    Name = "ragpdf-eip"
    Project = "RAGPDF"
  }
}
```

**File: `outputs.tf`**
```hcl
output "instance_id" {
  description = "EC2 Instance ID"
  value       = aws_instance.ragpdf_server.id
}

output "public_ip" {
  description = "Public IP address"
  value       = aws_eip.ragpdf_eip.public_ip
}

output "public_dns" {
  description = "Public DNS name"
  value       = aws_instance.ragpdf_server.public_dns
}

output "ssh_command" {
  description = "SSH connection command"
  value       = "ssh -i ${var.key_name}.pem ubuntu@${aws_eip.ragpdf_eip.public_ip}"
}

output "security_group_id" {
  description = "Security Group ID"
  value       = aws_security_group.ragpdf_sg.id
}
```

### Step 3.3: Create SSH Key Pair

**In AWS Console:**
```
1. Go to EC2 → Key Pairs
2. Click "Create key pair"
3. Name: ragpdf-key
4. Type: RSA
5. Format: .pem (for SSH)
6. Click "Create key pair"
7. Download ragpdf-key.pem
8. Save to: C:\Users\sarvn\.ssh\ragpdf-key.pem
```

**Set correct permissions (Windows):**
```powershell
# Move key to .ssh directory
New-Item -ItemType Directory -Force -Path "$HOME\.ssh"
Move-Item -Path "Downloads\ragpdf-key.pem" -Destination "$HOME\.ssh\ragpdf-key.pem"

# Only you should read this file
icacls "$HOME\.ssh\ragpdf-key.pem" /inheritance:r
icacls "$HOME\.ssh\ragpdf-key.pem" /grant:r "$($env:USERNAME):(R)"
```

### Step 3.4: Run Terraform

```powershell
# Navigate to Terraform directory
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf\terraform

# Initialize Terraform
terraform init

# Validate configuration
terraform validate

# Plan (see what will be created)
terraform plan

# Apply (create resources)
terraform apply

# Type 'yes' when prompted
```

**Expected output:**
```
Apply complete! Resources: 3 added, 0 changed, 0 destroyed.

Outputs:

instance_id = "i-0123456789abcdef0"
public_ip = "13.233.xxx.xxx"
ssh_command = "ssh -i ragpdf-key.pem ubuntu@13.233.xxx.xxx"
```

**📝 Save the public IP address!**

---

## Part 4: Connect to EC2 and Verify K3s

### Step 4.1: SSH into EC2

```powershell
# Use the SSH command from Terraform output
ssh -i "$HOME\.ssh\ragpdf-key.pem" ubuntu@13.233.xxx.xxx

# Or use explicit path
ssh -i "C:\Users\sarvn\.ssh\ragpdf-key.pem" ubuntu@13.233.xxx.xxx
```

**First time connection:**
```
The authenticity of host '13.233.xxx.xxx' can't be established.
Are you sure you want to continue connecting (yes/no)? yes
```

### Step 4.2: Verify K3s Installation

```bash
# Check K3s status
sudo systemctl status k3s

# Check K3s version
kubectl version

# Check nodes
kubectl get nodes

# Check all pods
kubectl get pods --all-namespaces
```

**Expected output:**
```
NAME            STATUS   ROLES                  AGE   VERSION
ip-172-31-xxx   Ready    control-plane,master   5m    v1.28.x+k3s1
```

---

## Part 5: Deploy Your Application to K3s

### Step 5.1: Create Kubernetes Namespace

```bash
kubectl create namespace ragpdf
```

### Step 5.2: Apply Your K8s Manifests

**Copy your manifests to EC2:**

**On your local machine:**
```powershell
# Assuming your k8s files are in kubernetes/ directory
scp -i "$HOME\.ssh\ragpdf-key.pem" -r kubernetes/ ubuntu@13.233.xxx.xxx:~/
```

**On EC2:**
```bash
cd ~/kubernetes

# Apply all manifests
kubectl apply -f backend-deployment.yaml -n ragpdf
kubectl apply -f frontend-deployment.yaml -n ragpdf
kubectl apply -f backend-service.yaml -n ragpdf
kubectl apply -f frontend-service.yaml -n ragpdf
kubectl apply -f ingress.yaml -n ragpdf
```

### Step 5.3: Verify Deployment

```bash
# Check deployments
kubectl get deployments -n ragpdf

# Check pods
kubectl get pods -n ragpdf

# Check services
kubectl get services -n ragpdf

# Check logs
kubectl logs -f <pod-name> -n ragpdf
```

---

## Part 6: Jenkins Integration with New EC2

### Step 6.1: Update Jenkinsfile

**Update the EC2 IP in your Jenkinsfile:**

```groovy
environment {
    // ... other variables ...
    EC2_PUBLIC_IP = '13.233.xxx.xxx'  // NEW IP from Terraform output
    SSH_CREDENTIALS_ID = 'ec2-ssh-new'  // We'll create this
    SSH_USER = 'ubuntu'
}
```

### Step 6.2: Add SSH Credentials to Jenkins

**Method 1: Using Jenkins UI**

1. **Go to Jenkins:**
   ```
   http://localhost:8084
   ```

2. **Navigate to:**
   ```
   Manage Jenkins → Credentials → System → Global credentials
   ```

3. **Click "Add Credentials"**

4. **Fill in details:**
   - **Kind:** `SSH Username with private key`
   - **ID:** `ec2-ssh-new`
   - **Description:** `EC2 SSH Key for RAGPDF (Friend's AWS)`
   - **Username:** `ubuntu`
   - **Private Key:** Click "Enter directly"
   - **Key:** Paste content of `ragpdf-key.pem`

5. **Get private key content:**
   ```powershell
   Get-Content "$HOME\.ssh\ragpdf-key.pem"
   ```

6. **Copy entire content including:**
   ```
   -----BEGIN RSA PRIVATE KEY-----
   ...your key content...
   -----END RSA PRIVATE KEY-----
   ```

7. **Paste in Jenkins and click OK**

**Method 2: Using Jenkins CLI (Advanced)**

```powershell
# Create credentials XML
$credXml = @"
<com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey plugin="ssh-credentials@1.18">
  <scope>GLOBAL</scope>
  <id>ec2-ssh-new</id>
  <description>EC2 SSH Key</description>
  <username>ubuntu</username>
  <privateKeySource class="com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey`$DirectEntryPrivateKeySource">
    <privateKey>$(Get-Content "$HOME\.ssh\ragpdf-key.pem" -Raw)</privateKey>
  </privateKeySource>
</com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey>
"@

# Save to file and import via Jenkins
```

### Step 6.3: Test SSH Connection from Jenkins

**Create a test job in Jenkins:**

1. **New Item** → Name: `test-ec2-connection` → Pipeline → OK

2. **Pipeline script:**
   ```groovy
   pipeline {
       agent any
       
       environment {
           EC2_IP = '13.233.xxx.xxx'
           SSH_CREDENTIALS = 'ec2-ssh-new'
           GIT_SSH = 'C:\\Program Files\\Git\\usr\\bin\\ssh.exe'
       }
       
       stages {
           stage('Test SSH') {
               steps {
                   script {
                       sshagent([env.SSH_CREDENTIALS]) {
                           bat """
                               "${GIT_SSH}" -o StrictHostKeyChecking=no ubuntu@${EC2_IP} "hostname && uptime"
                           """
                       }
                   }
               }
           }
           
           stage('Test K3s') {
               steps {
                   script {
                       sshagent([env.SSH_CREDENTIALS]) {
                           bat """
                               "${GIT_SSH}" -o StrictHostKeyChecking=no ubuntu@${EC2_IP} "sudo kubectl get nodes"
                           """
                       }
                   }
               }
           }
       }
   }
   ```

3. **Click "Build Now"**

4. **Check Console Output** - Should show:
   ```
   ip-172-31-xxx-xxx
   uptime output
   NAME            STATUS   ROLES    AGE   VERSION
   ```

---

## Part 7: Update Main Pipeline

### Step 7.1: Update Jenkinsfile with New IP

```groovy
environment {
    // ... existing variables ...
    
    EC2_PUBLIC_IP = '13.233.xxx.xxx'  // ← UPDATE THIS
    SSH_CREDENTIALS_ID = 'ec2-ssh-new'  // ← UPDATE THIS
    SSH_USER = 'ubuntu'
    
    // ... rest of variables ...
}
```

### Step 7.2: Commit and Push

```powershell
cd C:\Users\sarvn\OneDrive\Desktop\projects\ragpdf

git add Jenkinsfile
git commit -m "Update EC2 IP for new AWS account"
git push origin main
```

### Step 7.3: Trigger Jenkins Build

```
http://localhost:8084/job/ragpdf/build
```

---

## Part 8: Verification Checklist

### ✅ AWS Verification

- [ ] IAM user created with proper permissions
- [ ] Access keys generated and saved
- [ ] AWS CLI configured and tested
- [ ] Can run `aws sts get-caller-identity` successfully

### ✅ Terraform Verification

- [ ] All `.tf` files created
- [ ] `terraform init` successful
- [ ] `terraform plan` shows resources to create
- [ ] `terraform apply` completed successfully
- [ ] EC2 instance running in AWS console
- [ ] Elastic IP attached
- [ ] Security group has correct rules

### ✅ EC2 Verification

- [ ] Can SSH into EC2
- [ ] K3s installed and running
- [ ] `kubectl get nodes` shows ready node
- [ ] Docker installed
- [ ] Namespace `ragpdf` created

### ✅ Jenkins Verification

- [ ] SSH credentials added to Jenkins
- [ ] Test connection job passes
- [ ] Can execute `kubectl` commands from Jenkins
- [ ] Main pipeline updated with new IP
- [ ] Pipeline runs successfully

### ✅ Application Verification

- [ ] Pods running in K3s
- [ ] Services created
- [ ] Can access application via public IP
- [ ] Backend and frontend communicating

---

## Part 9: Important Files Backup

### Files to Keep Safe:

1. **AWS Credentials:**
   ```
   Access Key ID: AKIA...
   Secret Access Key: wJalr...
   ```

2. **SSH Private Key:**
   ```
   Location: C:\Users\sarvn\.ssh\ragpdf-key.pem
   ```

3. **Terraform State:**
   ```
   Location: terraform/terraform.tfstate
   ⚠️ Never delete this file!
   ```

4. **EC2 Public IP:**
   ```
   IP: 13.233.xxx.xxx
   ```

5. **Jenkins Credentials ID:**
   ```
   ID: ec2-ssh-new
   ```

---

## Part 10: Cost Management

### Monitor AWS Costs:

1. **Enable Billing Alerts:**
   ```
   AWS Console → Billing → Billing preferences
   ✅ Enable "Receive Billing Alerts"
   ```

2. **Create Budget:**
   ```
   AWS Console → Billing → Budgets → Create budget
   Type: Cost budget
   Amount: ₹500/month (or your limit)
   Alert threshold: 80%
   ```

3. **Expected Monthly Cost:**
   ```
   t3.medium EC2: ~₹1500/month
   30GB EBS: ~₹200/month
   Elastic IP (if instance running): Free
   Data transfer: ~₹100-300/month
   
   Total: ~₹1800-2000/month
   ```

4. **Cost Optimization Tips:**
   - Use t3.medium (better than t2)
   - Stop instance when not needed (but EIP charges apply)
   - Delete old snapshots
   - Monitor data transfer

---

## Troubleshooting

### Issue: Can't SSH into EC2

**Solution:**
```powershell
# Check security group allows your IP
aws ec2 describe-security-groups --group-ids sg-xxx

# Verify key permissions
icacls "$HOME\.ssh\ragpdf-key.pem"

# Try verbose SSH
ssh -v -i "$HOME\.ssh\ragpdf-key.pem" ubuntu@13.233.xxx.xxx
```

### Issue: K3s not installed

**Solution:**
```bash
# SSH into EC2
ssh -i ~/.ssh/ragpdf-key.pem ubuntu@13.233.xxx.xxx

# Manually install K3s
curl -sfL https://get.k3s.io | sh -

# Check status
sudo systemctl status k3s
```

### Issue: Terraform errors

**Solution:**
```powershell
# Refresh state
terraform refresh

# Re-init
terraform init -upgrade

# Check AWS credentials
aws configure list
```

---

## Quick Reference Commands

```powershell
# AWS
aws sts get-caller-identity
aws ec2 describe-instances --region ap-south-1

# Terraform
cd terraform
terraform init
terraform plan
terraform apply
terraform destroy  # ⚠️ Deletes everything!

# SSH
ssh -i "$HOME\.ssh\ragpdf-key.pem" ubuntu@13.233.xxx.xxx

# SCP
scp -i "$HOME\.ssh\ragpdf-key.pem" file.txt ubuntu@13.233.xxx.xxx:~/

# K3s (on EC2)
kubectl get nodes
kubectl get pods -n ragpdf
kubectl logs -f <pod-name> -n ragpdf
kubectl describe pod <pod-name> -n ragpdf
```

---

**📞 Need Help?**

1. Check AWS Console: https://console.aws.amazon.com
2. Check Terraform logs
3. Check Jenkins console output
4. SSH into EC2 and check K3s logs: `sudo journalctl -u k3s`

**🎯 Success! Ab aapka complete infrastructure ready hai! 🚀**
