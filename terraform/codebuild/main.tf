data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

resource "aws_codebuild_project" "codebuild" {
  name         = var.app_name_no_spaces
  service_role = aws_iam_role.codebuild_iam_role.arn

  concurrent_build_limit = 1

  artifacts {
    type      = "CODEPIPELINE"
    packaging = "NONE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:5.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = true

    environment_variable {
      name  = "AWS_DEFAULT_REGION"
      value = data.aws_region.current.name
    }

    environment_variable {
      name  = "AWS_ACCOUNT_ID"
      value = data.aws_caller_identity.current.account_id
    }

    environment_variable {
      name  = "IMAGE_REPO_NAME"
      value = var.image_repo_name
    }

    environment_variable {
      name  = "IMAGE_TAG"
      value = "latest"
    }

    environment_variable {
      name  = "NODE_ENV"
      value = "cicd"
    }
  }

  source {
    type = "CODEPIPELINE"
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "CodeBuild"
      stream_name = var.app_name_no_spaces
    }
  }
}

resource "aws_cloudwatch_log_group" "log_group" {
  name = "CodeBuild"
}

resource "aws_iam_policy" "base" {
  name        = "CodeBuildBasePolicy-${lower(var.app_name_no_spaces)}-${data.aws_region.current.name}"
  description = "Policy used in trust relationship with CodeBuild"
  path        = "/service-role/"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.app_name_no_spaces}",
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/codebuild/${var.app_name_no_spaces}:*"
        ]
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
      },
      {
        Effect = "Allow"
        Resource = [
          "arn:aws:s3:::codepipeline-${data.aws_region.current.name}-*"
        ]
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:GetBucketAcl",
          "s3:GetBucketLocation"
        ]
      },
      {
        Effect = "Allow"
        Resource = [
          "arn:aws:codebuild:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:report-group/${var.app_name_no_spaces}-*"
        ]
        Action = [
          "codebuild:CreateReportGroup",
          "codebuild:CreateReport",
          "codebuild:UpdateReport",
          "codebuild:BatchPutTestCases",
          "codebuild:BatchPutCodeCoverages"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "cloudwatch" {
  name        = "CodeBuildCloudWatchLogsPolicy-${lower(var.app_name_no_spaces)}-${data.aws_region.current.name}"
  description = "Policy used in trust relationship with CodeBuild"
  path        = "/service-role/"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Resource = [
          aws_cloudwatch_log_group.log_group.arn,
          "${aws_cloudwatch_log_group.log_group.arn}:*"
        ]
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "ecr" {
  name = "CodeBuildPublishEcr"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Resource = "*"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:CompleteLayerUpload",
          "ecr:GetAuthorizationToken",
          "ecr:InitiateLayerUpload",
          "ecr:PutImage",
          "ecr:UploadLayerPart"
        ]
      }
    ]
  })
}

resource "aws_iam_policy" "parameter_store" {
  name = "CodeBuildReadParameterStore"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Resource = "*"
        Action = [
          "ssm:DescribeParameters"
        ]
      },
      {
        Effect = "Allow"
        Resource = [
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/CodeBuild/*",
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.app_name_no_spaces}/CICD/*"
        ]
        Action = [
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
      }
    ]
  })
}

resource "aws_iam_role" "codebuild_iam_role" {
  name = "CodeBuildServiceRole"
  path = "/service-role/"

  managed_policy_arns = [
    aws_iam_policy.base.arn,
    aws_iam_policy.cloudwatch.arn,
    aws_iam_policy.ecr.arn,
    aws_iam_policy.parameter_store.arn
  ]

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
      }
    ]
  })
}