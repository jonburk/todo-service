data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

data "aws_ecs_task_definition" "task_definition" {
  task_definition = aws_ecs_task_definition.task_definition.family
}

data "aws_ami" "ecs_ami" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

resource "aws_iam_policy" "read_parameter_store" {
  name        = "Read${var.app_name_no_spaces}${var.environment}ParameterStore"
  path        = "/"
  description = "Allows reading parameters for ${var.app_name} in ${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:DescribeParameters",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParametersByPath",
          "ssm:GetParameter",
          "ssm:GetParameters"
        ],
        Resource : "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.app_name_no_spaces}/${var.environment}/*"
      }
    ]
  })
}

resource "aws_iam_policy" "cloud_watch_logs" {
  name        = "ECS-CloudWatchLogs"
  description = "Allow ECS to write to CloudWatch"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ],
        Resource : "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role" "ecs_service_role" {
  name = "ecsServiceRole"

  managed_policy_arns = ["arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceRole"]

  assume_role_policy = jsonencode({
    Version = "2008-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "ecs.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role" "ecs_instance_role" {
  name = "ecsInstanceRole${var.app_name_no_spaces}${var.environment}"

  managed_policy_arns = [
    aws_iam_policy.read_parameter_store.arn,
    aws_iam_policy.cloud_watch_logs.arn,
    "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
  ]

  assume_role_policy = jsonencode({
    Version = "2008-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_instance_profile" "instance_profile" {
  name = "ecsInstanceRole${var.app_name_no_spaces}${var.environment}"
  role = aws_iam_role.ecs_instance_role.name
}

resource "aws_ecs_cluster" "ecs_cluster" {
  name = "${var.app_short_name}-cluster"
}

resource "aws_ecs_service" "ecs_service" {
  name                              = "${var.app_short_name}-service"
  cluster                           = aws_ecs_cluster.ecs_cluster.id
  desired_count                     = 1
  enable_ecs_managed_tags           = true
  health_check_grace_period_seconds = 30
  iam_role                          = aws_iam_role.ecs_service_role.name
  launch_type                       = "EC2"
  task_definition                   = "${aws_ecs_task_definition.task_definition.family}:${max(aws_ecs_task_definition.task_definition.revision, data.aws_ecs_task_definition.task_definition.revision)}"

  deployment_circuit_breaker {
    enable   = false
    rollback = false
  }

  deployment_controller {
    type = "ECS"
  }

  load_balancer {
    container_name   = "${var.app_short_name}-container"
    container_port   = var.app_port_number
    target_group_arn = var.alb_target_group_arn
  }

  ordered_placement_strategy {
    field = "attribute:ecs.availability-zone"
    type  = "spread"
  }
}

resource "aws_ecs_task_definition" "task_definition" {
  family = var.app_short_name

  container_definitions = jsonencode([
    {
      name  = "${var.app_short_name}-container"
      image = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${data.aws_region.current.name}.amazonaws.com/${var.app_short_name}:latest"
      portMappings = [
        {
          containerPort = var.app_port_number
          hostPort      = 0
          protocol      = "tcp"
        }
      ]
      environment = [
        {
          name : "AWS_REGION"
          value : data.aws_region.current.name
        },
        {
          name : "NODE_ENV"
          value : lower(var.environment)
        }
      ]
      essential   = true
      mountPoints = []
    }
  ])
  cpu                      = var.app_instance_cpu
  memory                   = var.app_instance_memory
  requires_compatibilities = ["EC2"]
}

resource "aws_security_group" "ecs_sg" {
  name_prefix = "${var.app_short_name}-ecs-sg-"
  description = "ECS Allowed Ports"
  vpc_id      = var.vpc_id

  ingress = [
    {
      description      = ""
      from_port        = 32768
      to_port          = 65535
      protocol         = "tcp"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = []
      prefix_list_ids  = []
      security_groups  = []
      self             = false
    }
  ]

  egress = [
    {
      description      = ""
      from_port        = 0
      to_port          = 0
      protocol         = "-1"
      cidr_blocks      = ["0.0.0.0/0"]
      ipv6_cidr_blocks = []
      prefix_list_ids  = []
      security_groups  = []
      self             = false
    }
  ]
}

resource "aws_launch_configuration" "lc" {
  name_prefix   = "${var.app_short_name}-lc-"
  image_id      = data.aws_ami.ecs_ami.image_id
  instance_type = var.app_instance_type

  iam_instance_profile             = aws_iam_instance_profile.instance_profile.arn
  security_groups                  = [aws_security_group.ecs_sg.id]
  vpc_classic_link_security_groups = []

  user_data = "#!/bin/bash\necho ECS_CLUSTER=${aws_ecs_cluster.ecs_cluster.name} >> /etc/ecs/ecs.config;echo ECS_BACKEND_HOST= >> /etc/ecs/ecs.config;"

  lifecycle {
    create_before_destroy = true
  }
}

module "asg" {
  source  = "terraform-aws-modules/autoscaling/aws"
  version = "~>4.6"

  name = "${var.app_short_name}-asg"

  min_size                  = 0
  max_size                  = 1
  desired_capacity          = 1
  health_check_type         = "EC2"
  health_check_grace_period = 0
  vpc_zone_identifier       = var.public_subnets

  use_lc               = true
  launch_configuration = aws_launch_configuration.lc.id
}