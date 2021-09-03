output "service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.ecs_service.name
}

output "cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.ecs_cluster.name
}