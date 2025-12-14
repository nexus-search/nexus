terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 6.3.0"
    }
  }
  required_version = ">= 1.0"
}

provider "aws" {
  region = "eu-north-1" # Stockholm
}

# 1. SSH Key
resource "aws_key_pair" "deployer" {
  key_name   = "deployer-key"
  public_key = file("~/.ssh/id_rsa.pub")
}

# 2. Security Group
resource "aws_security_group" "app_sg" {
  name        = "production_firewall"
  description = "Allow SSH and HTTP"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Restrict this to your IP if you can!
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 3. The EC2 Instance
resource "aws_instance" "web" {
  ami           = "ami-0fa91bc90632c73c9"
  instance_type = "t3.medium"
  key_name      = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.app_sg.id]

  root_block_device {
    volume_size = 30
    volume_type = "gp3"
  }

  tags = {
    Name = "Production-Server"
  }
}


resource "local_file" "ansible_inventory" {
  content = <<EOF
[web]
${aws_instance.web.public_ip} ansible_user=ubuntu ansible_ssh_common_args='-o StrictHostKeyChecking=no'
EOF
  filename = "${path.module}/ansible/inventory.ini"
}


output "server_ip" {
  value = aws_instance.web.public_ip
}
