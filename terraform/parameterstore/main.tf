resource "aws_ssm_parameter" "service_port" {
  name        = "/CodeBuild/${var.app_name_no_spaces}/${var.environment}/servicePort"
  description = "Task list service port"
  type        = "String"
  value       = "443"
}

resource "aws_ssm_parameter" "service_uri" {
  name        = "/CodeBuild/${var.app_name_no_spaces}/${var.environment}/serviceUri"
  description = "Task list service URI"
  type        = "String"
  value       = "https://${var.domain_name}"
}

resource "aws_ssm_parameter" "cicd_connection_string" {
  name        = "/${var.app_name_no_spaces}/CICD/mongoConnectionString"
  description = "MongoDB connection string used by CICD to run tests"
  type        = "SecureString"
  value       = "mongodb://${var.mongodb_username}:${var.mongodb_password}@${join(",", var.mongodb_seed_list)}/${var.mongodb_cicd_collection}?ssl=true&replicaSet=${var.mongodb_replica_set}&authSource=admin"
}

resource "aws_ssm_parameter" "connection_string" {
  name        = "/${var.app_name_no_spaces}/${var.environment}/mongoConnectionString"
  description = "MongoDB connection string used by the ${var.application_name} application"
  type        = "SecureString"
  value       = "mongodb://${var.mongodb_username}:${var.mongodb_password}@${join(",", var.mongodb_seed_list)}/${var.mongodb_collection}?ssl=true&replicaSet=${var.mongodb_replica_set}&authSource=admin"
}

resource "aws_ssm_parameter" "oauth_callback_uri" {
  name        = "/${var.app_name_no_spaces}/${var.environment}/oauthCallbackUri"
  description = "Task list OAuth callback URI"
  type        = "String"
  value       = "https://${var.domain_name}/auth/google/callback"
}

resource "aws_ssm_parameter" "oauth_client_id" {
  name        = "/${var.app_name_no_spaces}/${var.environment}/oauthClientId"
  description = "${var.application_name} OAuth client ID"
  type        = "SecureString"
  value       = var.oauth_client_id
}

resource "aws_ssm_parameter" "oauth_client_secret" {
  name        = "/${var.app_name_no_spaces}/${var.environment}/oauthClientSecret"
  description = "${var.application_name} OAuth client secret"
  type        = "SecureString"
  value       = var.oauth_client_secret
}

resource "aws_ssm_parameter" "session_secret" {
  name        = "/${var.app_name_no_spaces}/${var.environment}/sessionSecret"
  description = "${var.application_name} session secret"
  type        = "SecureString"
  value       = var.session_secret
}