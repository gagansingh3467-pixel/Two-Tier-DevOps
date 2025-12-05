provider "aws" {
  region = "eu-north-1"
}

# ==========================
# SSH KEY (already imported)
# ==========================
resource "aws_key_pair" "two_tier_key" {
  key_name   = "two-tier-key"
  public_key = file("~/.ssh/two-tier-key.pub")
}

# ==========================
# SECURITY GROUP
# ==========================
resource "aws_security_group" "two_tier_sg" {
  name        = "two-tier-sg"
  description = "Allow SSH, HTTP, Grafana, Prometheus, Node Exporter, cAdvisor"

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Frontend / NGINX
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Grafana
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Prometheus
  ingress {
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Node Exporter
  ingress {
    from_port   = 9100
    to_port     = 9100
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # cAdvisor
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # All outbound traffic allowed
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ==========================
# EC2 INSTANCE
# ==========================
resource "aws_instance" "two_tier" {
  ami           = "ami-07e075f00c26b085a"   # Ubuntu 22.04 eu-north-1
  instance_type = "t3.micro"                # FREE TIER ELIGIBLE
  key_name      = aws_key_pair.two_tier_key.key_name
  vpc_security_group_ids = [aws_security_group.two_tier_sg.id]

  # -------------------------
  # USER DATA (AUTOMATIC DEPLOYMENT)
  # -------------------------
  user_data = <<EOF
#!/bin/bash
set -e

# Update packages
apt update -y
apt upgrade -y

# Install Docker
apt install -y ca-certificates curl gnupg lsb-release

curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /usr/share/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list

apt update -y
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

systemctl enable docker
systemctl start docker

# Clone your GitHub repository
cd /home/ubuntu
git clone https://github.com/gagansingh3467-pixel/Two-Tier-DevOps.git two-tier-devops

# Fix permissions
chown -R ubuntu:ubuntu /home/ubuntu/two-tier-devops

# Start your full stack
cd two-tier-devops
docker compose up -d --build
EOF

  tags = {
    Name = "two-tier-server"
  }
}

# ==========================
# ATTACH ELASTIC IP
# ==========================
resource "aws_eip" "two_tier_eip" {
  instance = aws_instance.two_tier.id
}
