
variable "app_short_name" {
  description = "The short name of the application, used to build resource names"
  type        = string
}

variable "app_name_no_spaces" {
  description = "Application name with spaces removed"
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name where the application is deployed"
  type        = string
}

variable "ecs_service_name" {
  description = "ECS service name where the application is deployed"
  type        = string
}

variable "ui_github_repo" {
  description = "GitHub repo for the UI code"
  type        = string
}

variable "service_github_repo" {
  description = "GitHub repo for the service code"
  type        = string
}

variable "codebuild_project_name" {
  description = "CodeBuild project name"
  type        = string
}