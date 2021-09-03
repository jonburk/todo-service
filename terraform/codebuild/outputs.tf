output "project_name" {
  description = "CodeBuild project name"
  value       = aws_codebuild_project.codebuild.name
}