#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════
# Install Node Exporter on EC2 Ubuntu Instance
#
# This script:
#   1. Downloads and installs Node Exporter
#   2. Creates systemd service
#   3. Starts and enables Node Exporter
#   4. Exposes port 9100 for Prometheus scraping
#
# Run on EC2 instance:
#   chmod +x install-node-exporter.sh
#   sudo ./install-node-exporter.sh
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

NODE_EXPORTER_VERSION="1.7.0"
ARCH="linux-amd64"
DOWNLOAD_URL="https://github.com/prometheus/node_exporter/releases/download/v${NODE_EXPORTER_VERSION}/node_exporter-${NODE_EXPORTER_VERSION}.${ARCH}.tar.gz"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Installing Node Exporter v${NODE_EXPORTER_VERSION}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root or with sudo"
   exit 1
fi

# Step 1: Create node_exporter user
echo ""
echo "👤 Creating node_exporter user..."
if id "node_exporter" &>/dev/null; then
    echo "✅ User node_exporter already exists"
else
    useradd --no-create-home --shell /bin/false node_exporter
    echo "✅ User node_exporter created"
fi

# Step 2: Download Node Exporter
echo ""
echo "⬇️  Downloading Node Exporter..."
cd /tmp
wget -q --show-progress ${DOWNLOAD_URL}
echo "✅ Download complete"

# Step 3: Extract archive
echo ""
echo "📂 Extracting archive..."
tar xzf node_exporter-${NODE_EXPORTER_VERSION}.${ARCH}.tar.gz
echo "✅ Extraction complete"

# Step 4: Install binary
echo ""
echo "📥 Installing binary to /usr/local/bin..."
cp node_exporter-${NODE_EXPORTER_VERSION}.${ARCH}/node_exporter /usr/local/bin/
chown node_exporter:node_exporter /usr/local/bin/node_exporter
chmod +x /usr/local/bin/node_exporter
echo "✅ Binary installed"

# Step 5: Clean up
echo ""
echo "🧹 Cleaning up temporary files..."
rm -rf /tmp/node_exporter-${NODE_EXPORTER_VERSION}.${ARCH}*
echo "✅ Cleanup complete"

# Step 6: Create systemd service
echo ""
echo "⚙️  Creating systemd service..."
cat > /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Node Exporter
Documentation=https://github.com/prometheus/node_exporter
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=node_exporter
Group=node_exporter
ExecStart=/usr/local/bin/node_exporter \
    --collector.filesystem.mount-points-exclude=^/(dev|proc|sys|var/lib/docker/.+|var/lib/kubelet/.+)($|/) \
    --collector.filesystem.fs-types-exclude=^(autofs|binfmt_misc|bpf|cgroup2?|configfs|debugfs|devpts|devtmpfs|fusectl|hugetlbfs|iso9660|mqueue|nsfs|overlay|proc|procfs|pstore|rpc_pipefs|securityfs|selinuxfs|squashfs|sysfs|tracefs)$

SyslogIdentifier=node_exporter
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Systemd service created"

# Step 7: Reload systemd and start service
echo ""
echo "🚀 Starting Node Exporter service..."
systemctl daemon-reload
systemctl enable node_exporter
systemctl start node_exporter
echo "✅ Service started and enabled"

# Step 8: Check service status
echo ""
echo "🔍 Checking service status..."
sleep 2
if systemctl is-active --quiet node_exporter; then
    echo "✅ Node Exporter is running"
else
    echo "❌ Node Exporter failed to start"
    systemctl status node_exporter
    exit 1
fi

# Step 9: Verify metrics endpoint
echo ""
echo "🔍 Verifying metrics endpoint..."
if curl -s http://localhost:9100/metrics | head -n 1 | grep -q "HELP"; then
    echo "✅ Metrics endpoint responding"
else
    echo "❌ Metrics endpoint not responding"
    exit 1
fi

# Display version and info
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Node Exporter Installation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Version: $(/usr/local/bin/node_exporter --version | head -n 1)"
echo "🌐 Metrics URL: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):9100/metrics"
echo ""
echo "🔧 Useful Commands:"
echo "   Status:  sudo systemctl status node_exporter"
echo "   Stop:    sudo systemctl stop node_exporter"
echo "   Start:   sudo systemctl start node_exporter"
echo "   Restart: sudo systemctl restart node_exporter"
echo "   Logs:    sudo journalctl -u node_exporter -f"
echo ""
echo "⚠️  IMPORTANT: Update AWS Security Group to allow port 9100"
echo "   Add inbound rule: TCP 9100 from your local IP"
echo ""
echo "✅ You can now add this target to Prometheus!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
