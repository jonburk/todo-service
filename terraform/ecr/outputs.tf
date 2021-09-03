output "repo_name" {
  description = "The name of the repo in ECR containing the application image"
  value       = aws_ecr_repository.ecr_repo.name
}