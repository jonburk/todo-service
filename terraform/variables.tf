variable "application_name" {
  description = "Application name used in resource tags"
  type        = string
  default     = "Task List"
}

variable "environment" {
  description = "SDLC environment name used in resource tags"
  type        = string
  default     = "Production"
}

variable "domain_name" {
  description = "The domain name for the application"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr_block" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_count" {
  description = "The number of public subnets to create"
  type        = number
  default     = 2
}

variable "app_port_number" {
  description = "Internal TCP port number used by the application"
  type        = number
  default     = 8080
}

variable "app_instance_cpu" {
  description = "The CPU units required by the app"
  type        = number
  default     = 512
}

variable "app_instance_memory" {
  description = "The memory (MiB) required by the app"
  type        = number
  default     = 450
}

variable "app_instance_type" {
  description = "Instance type used for EC2 instances in the cluster's autoscaling group"
  type        = string
  default     = "t2.micro"
}

variable "ui_github_repo" {
  description = "GitHub repo for the UI code"
  type        = string
}

variable "service_github_repo" {
  description = "GitHub repo for the service code"
  type        = string
}

variable "mongodb_username" {
  description = "The MongoDB user name used to construct connection strings"
  type        = string
}

variable "mongodb_password" {
  description = "The MongoDB password used to construct connection strings"
  type        = string
  sensitive   = true
}

variable "mongodb_seed_list" {
  description = "The MongoDB seed list (host:port) used to construct connection strings"
  type        = list(string)
}

variable "mongodb_replica_set" {
  description = "The MongoDB replica set used to construct connection strings"
  type        = string
}

variable "mongodb_collection" {
  description = "The MongoDB collection for the application"
  type        = string
}

variable "mongodb_cicd_collection" {
  description = "The MongoDB collection used by CICD to run tests"
  type        = string
}

variable "session_secret" {
  description = "Used to secure session data"
  type        = string
  sensitive   = true
}

variable "oauth_client_id" {
  description = "The OAuth2 client ID"
  type        = string
  sensitive   = true
}

variable "oauth_client_secret" {
  description = "The OAuth2 client secret"
  type        = string
  sensitive   = true
}