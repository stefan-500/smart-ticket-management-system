terraform {
  required_version = ">= 1.9, < 2.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = { Project = "smart-ticket", Environment = "sandbox", ManagedBy = "Terraform" }
  }
}

variable "region" {
  type    = string
  default = "us-east-1"
  validation {
    condition     = contains(["us-east-1", "us-west-2"], var.region)
    error_message = "Use a region supported by the sandbox."
  }
}

variable "audience_cidr" {
  type        = string
  description = "Public IPv4 CIDR allowed to access HTTP and SSH."
  validation {
    condition     = can(cidrnetmask(var.audience_cidr))
    error_message = "Supply a valid IPv4 CIDR."
  }
}

variable "name" {
  type    = string
  default = "smart-ticket"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,18}[a-z0-9]$", var.name))
    error_message = "Use 3-20 lowercase letters, digits or hyphens, beginning with a letter and ending with a letter or digit."
  }
}

variable "key_name" {
  type        = string
  description = "Name of an existing EC2 SSH key pair in the selected sandbox region."
  validation {
    condition     = length(trimspace(var.key_name)) > 0
    error_message = "Create an EC2 key pair and supply its name."
  }
}

variable "instance_type" {
  type        = string
  default     = "t3.medium"
  description = "x86 instance for MySQL, Spring Boot, Nginx and image builds. Medium provides 4 GiB RAM."
  validation {
    condition     = contains(["t2.medium", "t3.medium", "t3a.medium"], var.instance_type)
    error_message = "Use an x86 medium instance supported by the sandbox; the build and three containers need the memory."
  }
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]
  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# One public subnet; no dependency on the sandbox having a default VPC.
resource "aws_vpc" "main" {
  cidr_block           = "10.42.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = var.name }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
}

resource "aws_subnet" "public" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.42.0.0/24"
  tags       = { Name = "${var.name}-public" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
}

resource "aws_route" "internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "app" {
  name_prefix = "${var.name}-app-"
  description = "Demo HTTP and SSH access"
  vpc_id      = aws_vpc.main.id
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = var.audience_cidr
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = var.audience_cidr
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
}

resource "aws_vpc_security_group_egress_rule" "app" {
  security_group_id = aws_security_group.app.id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type
  key_name                    = var.key_name
  subnet_id                   = aws_subnet.public.id
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.app.id]
  user_data                   = replace(file("${path.module}/bootstrap.sh"), "\r\n", "\n")
  user_data_replace_on_change = true

  metadata_options { http_tokens = "required" }
  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  tags = { Name = var.name }
  depends_on = [
    aws_route.internet,
    aws_route_table_association.public,
    aws_vpc_security_group_egress_rule.app,
  ]
}

output "instance_id" { value = aws_instance.app.id }
output "public_ip" { value = aws_instance.app.public_ip }
output "app_url" { value = "http://${aws_instance.app.public_ip}" }
output "ssh_command" { value = "ssh -i <path-to-key.pem> ec2-user@${aws_instance.app.public_ip}" }
