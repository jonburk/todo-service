variable "app_name" {
  description = "Application name"
  type        = string
}

variable "app_name_no_spaces" {
  description = "Application name with spaces removed"
  type        = string
}

variable "environment" {
  description = "SDLC environment name used in resource tags"
  type        = string
}

variable "app_short_name" {
  description = "The short name of the application, used to build resource names"
  type        = string
}

variable "vpc_id" {
  description = "The VPC ID"
  type        = string
}

variable "public_subnets" {
  description = "List of IDs of public subnets"
  type        = list(string)
}

variable "alb_target_group_arn" {
  description = "Application load balancer target group ARN"
  type        = string
}

variable "app_port_number" {
  description = "Internal TCP port number used by the application"
  type        = number
}

variable "app_instance_cpu" {
  description = "The CPU units required by the app"
  type        = number
}

variable "app_instance_memory" {
  description = "The memory (MiB) required by the app"
  type        = number
}

variable "app_instance_type" {
  description = "Instance type used for EC2 instances in the cluster's autoscaling group"
  type        = string
}