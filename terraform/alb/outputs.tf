output "target_group_arn" {
  description = "Target group ARN"
  value       = module.alb.target_group_arns[0]
}

output "alb_dns_name" {
  description = "DNS name of the ALB"
  value       = module.alb.lb_dns_name
}