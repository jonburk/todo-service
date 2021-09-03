variable "app_short_name" {
  description = "The short name of the application, used to build resource names"
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC to create the ALB in"
  type        = string
}

variable "subnets" {
  description = "List of subnets used by the ALB"
  type        = list(string)
}

variable "domain_name" {
  description = "The domain name for the application"
  type        = string
}