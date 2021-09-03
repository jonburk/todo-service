variable "application_name" {
  description = "Application name used in resource tags"
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

variable "domain_name" {
  description = "The domain name for the application"
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